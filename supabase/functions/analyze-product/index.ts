import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeProductRequest {
  analysisId: string;
  imageBase64: string;
  sku?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { analysisId, imageBase64, sku, category }: AnalyzeProductRequest = await req.json();
    
    console.log('Starting product analysis for analysisId:', analysisId);

    // Generate hash of the image for duplicate detection
    const imageHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(imageBase64)
    );
    const hashArray = Array.from(new Uint8Array(imageHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if this exact image has already been analyzed for this analysisId using hash
    const { data: existingProduct, error: existingProductError } = await supabase
      .from('analysis_products')
      .select('*')
      .eq('analysis_id', analysisId)
      .eq('image_hash', hashHex)
      .maybeSingle();

    if (existingProductError && existingProductError.code !== 'PGRST116') {
      console.error('Error checking existing product analysis:', existingProductError);
    }

    if (existingProduct) {
      console.log('Found existing analysis for same image, reusing results:', existingProduct.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            analysis_description: existingProduct.analysis_description,
            detected_color: existingProduct.color,
            detected_fabric: existingProduct.fabric,
            risk_level: existingProduct.risk_level,
            demand_projection: existingProduct.demand_score,
            demand_calculation: existingProduct.score_justification,
            estimated_market_price: existingProduct.estimated_price,
            estimated_production_cost: existingProduct.estimated_production_cost,
            insights: existingProduct.insights,
            sources: existingProduct.sources,
            recommended_quantity: existingProduct.recommended_quantity,
            target_audience_size: existingProduct.target_audience_size,
            projected_revenue: existingProduct.projected_revenue,
            product_id: existingProduct.id,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    
    // Get trending data from database for this analysis
    const [colorsResult, fabricsResult, modelsResult] = await Promise.all([
      supabase.from('trending_colors').select('*').eq('analysis_id', analysisId),
      supabase.from('trending_fabrics').select('*').eq('analysis_id', analysisId),
      supabase.from('trending_models').select('*').eq('analysis_id', analysisId)
    ]);

    const trendingColors = colorsResult.data || [];
    const trendingFabrics = fabricsResult.data || [];
    const trendingModels = modelsResult.data || [];

    console.log('Retrieved trends:', { colors: trendingColors.length, fabrics: trendingFabrics.length, models: trendingModels.length });

    const systemPrompt = `Você é um Fashion Trend Analyzer, especializado em identificar se peças de roupa estão alinhadas com as tendências atuais da moda.
Sempre que receber uma imagem, você deve analisar visualmente a peça considerando:
- Estilo, Modelagem, Caimento
- Cores
- Materiais  
- Estética geral

Compare com tendências atuais, considerando:
- Moda feminina, masculina e unissex
- Streetwear, passarelas, fast fashion, TikTok e comportamento de consumo
- Estéticas predominantes (ex.: Y2K, minimalismo, quiet luxury, Old Money, athleisure, oversized, normcore, workwear etc.)`;

    // Calculate source data counts from trends
    const sourceDataMap = new Map<string, number>();
    
    [...trendingColors, ...trendingFabrics, ...trendingModels].forEach(trend => {
      if (trend.sources) {
        trend.sources.forEach((source: string) => {
          const count = sourceDataMap.get(source) || 0;
          sourceDataMap.set(source, count + (trend.search_appearances || 0));
        });
      }
    });

    // Calculate match scores for explicit cross-referencing
    const colorMatchData = trendingColors.map(c => ({
      name: c.name,
      hex: c.hex_code,
      confidence: c.confidence_score,
      appearances: c.search_appearances || 0
    }));

    const fabricMatchData = trendingFabrics.map(f => ({
      name: f.name,
      percentage: f.trend_percentage,
      appearances: f.search_appearances || 0
    }));

    const modelMatchData = trendingModels.map(m => ({
      name: m.name,
      popularity: m.popularity,
      appearances: m.search_appearances || 0
    }));

    const trendsSummary = `
TENDÊNCIAS ATUAIS PARA COMPARAÇÃO:

Cores em Alta:
${colorMatchData.map(c => `- ${c.name} (${c.hex}): ${c.confidence}% confiança, ${c.appearances} aparições`).join('\n')}

Tecidos em Tendência:
${fabricMatchData.map(f => `- ${f.name}: ${f.percentage}, ${f.appearances} aparições`).join('\n')}

Modelagens Populares:
${modelMatchData.map(m => `- ${m.name} (${m.popularity}): ${m.appearances} aparições`).join('\n')}

FONTES DE DADOS:
${Array.from(sourceDataMap.entries()).map(([source, count]) => `- ${source}: ${count} pontos de dados`).join('\n')}
`;

    const userPrompt = `Analise esta peça de roupa e determine se ela está alinhada com as tendências atuais da moda.
${category ? `Categoria: ${category}` : ''}
${sku ? `SKU: ${sku}` : ''}

${trendsSummary}

Responda SEMPRE neste formato JSON estruturado:
{
  "trend_status": "Em alta" ou "Não está em alta",
  "trend_level": "Alto", "Médio" ou "Baixo",
  "analysis_description": "Descrição visual da peça: cores, tecido, modelagem, estilo",
  "detected_color": "Nome da cor + código hex (ex: 'Azul Marinho #1A3B5C')",
  "detected_fabric": "Tipo de tecido identificado",
  "detected_style": "Modelagem/corte/estilo detectado",
  "reason": "Explique de forma curta com base nas tendências atuais por que está ou não em alta",
  "related_trend": "Nome da estética ou movimento de moda relacionado (ex: Y2K, quiet luxury, streetwear, athleisure)",
  "current_usage": "Onde essa tendência aparece atualmente (ex: 'viral em redes sociais', 'comum em fast fashion', 'apareceu nas coleções recentes', 'usado por influenciadores')",
  "recommendation": "Como usar, combinar ou adaptar. Se não está em alta, sugira mudanças específicas",
  "estimated_market_price": 89.90,
  "estimated_production_cost": 35.50,
  "risk_level": "low/medium/high",
  "demand_projection": 0-100,
  "sources": [
    {"source": "Nome da Fonte", "count": número}
  ],
  "insights": [
    {
      "type": "positive/negative/improvement",
      "title": "Título do insight",
      "description": "Descrição detalhada",
      "impact": "high/medium/low"
    }
  ]
}

REGRAS IMPORTANTES:
1. trend_status deve ser "Em alta" ou "Não está em alta"
2. trend_level deve ser "Alto", "Médio" ou "Baixo" baseado no alinhamento com as tendências
3. reason deve ser curto, objetivo e referenciando as tendências listadas acima
4. related_trend deve mencionar uma estética ou movimento de moda específico
5. current_usage deve indicar onde a tendência está aparecendo no momento (redes, fast fashion, passarelas, etc)
6. recommendation deve ser prática e acionável
7. demand_projection: calcule 0-100 baseado no alinhamento (Alto=80-100, Médio=50-79, Baixo=0-49)
8. risk_level: "low" se demand_projection > 75, "medium" se 50-75, "high" se < 50
9. estimated_market_price: pesquise mentalmente preços em e-commerces brasileiros para produtos similares
10. estimated_production_cost: análise realista baseada em materiais e complexidade
11. sources: use os dados das fontes listadas acima
12. insights: forneça 2-3 insights práticos sobre a peça`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for consistency - same image should always produce same scores
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI Response received');

    // Parse JSON from AI response
    let analysisData;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisData = JSON.parse(cleanedResponse);
      console.log('Parsed analysis data keys:', Object.keys(analysisData));
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('AI Response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }

    // Extract and validate required fields, normalizing types
    const rawDemandScore = Number(analysisData.demand_projection ?? 0);
    const demandScore = Number.isFinite(rawDemandScore) ? Math.max(0, Math.min(100, Math.round(rawDemandScore))) : 0;
    const estimatedPrice = Number(analysisData.estimated_market_price ?? 0) || 0;
    const productionCost = Number(analysisData.estimated_production_cost ?? 0) || 0;
    
    // Validate critical data
    if (!analysisData.detected_color || !analysisData.detected_fabric || !analysisData.risk_level) {
      console.error('Missing critical analysis data:', analysisData);
      throw new Error('Análise incompleta: dados críticos ausentes');
    }
    
    console.log('Extracted values:', {
      demandScore,
      estimatedPrice,
      productionCost,
      detected_color: analysisData.detected_color,
      detected_fabric: analysisData.detected_fabric,
      risk_level: analysisData.risk_level
    });

    // Calculate recommended quantity based on demand_score
    let recommendedQuantity = 0;
    
    if (demandScore >= 80) {
      // Alta demanda: 100-200 unidades
      recommendedQuantity = Math.floor(100 + (demandScore - 80) * 5);
    } else if (demandScore >= 60) {
      // Boa demanda: 50-100 unidades
      recommendedQuantity = Math.floor(50 + (demandScore - 60) * 2.5);
    } else if (demandScore >= 40) {
      // Demanda moderada: 30-60 unidades
      recommendedQuantity = Math.floor(30 + (demandScore - 40) * 1.5);
    } else {
      // Baixa demanda: 10-30 unidades
      recommendedQuantity = Math.floor(10 + demandScore * 0.5);
    }

    // Calculate target audience size based on demand score and recommended quantity
    // Higher demand score = higher expected conversion rate
    let conversionRate = 0.01; // default 1%
    
    if (demandScore >= 80) {
      conversionRate = 0.05; // 5% conversion for high demand
    } else if (demandScore >= 60) {
      conversionRate = 0.03; // 3% conversion for good demand
    } else if (demandScore >= 40) {
      conversionRate = 0.02; // 2% conversion for moderate demand
    }
    
    const targetAudienceSize = Math.ceil(recommendedQuantity / conversionRate);
    const projectedRevenue = estimatedPrice * recommendedQuantity;
    const totalProductionCost = productionCost * recommendedQuantity;
    const profitMargin = estimatedPrice > 0 ? ((estimatedPrice - productionCost) / estimatedPrice * 100) : 0;

    // Build score justification from the new format
    const scoreJustification = `${analysisData.trend_status} - Grau: ${analysisData.trend_level}. ${analysisData.reason || ''} (Score: ${demandScore}/100)`;

    console.log(`Calculated recommended quantity: ${recommendedQuantity} for demand score: ${demandScore}`);
    console.log(`Target audience size: ${targetAudienceSize} (conversion rate: ${conversionRate * 100}%)`);
    console.log(`Estimated price: R$ ${estimatedPrice.toFixed(2)}, Production cost: R$ ${productionCost.toFixed(2)}`);
    console.log(`Projected revenue: R$ ${projectedRevenue.toFixed(2)}, Profit margin: ${profitMargin.toFixed(1)}%`);

    // Prepare product data for insertion
    const productInsertData = {
      analysis_id: analysisId,
      image_url: imageBase64,
      image_hash: hashHex,
      sku: sku || null,
      category: category || null,
      color: analysisData.detected_color || null,
      fabric: analysisData.detected_fabric || null,
      demand_score: demandScore,
      risk_level: analysisData.risk_level || 'medium',
      insights: analysisData.insights || [],
      analysis_description: analysisData.analysis_description || null,
      sources: analysisData.sources || [],
      score_justification: scoreJustification,
      recommended_quantity: recommendedQuantity,
      target_audience_size: targetAudienceSize,
      estimated_price: estimatedPrice,
      projected_revenue: projectedRevenue,
      estimated_production_cost: productionCost,
      trend_status: analysisData.trend_status || null,
      trend_level: analysisData.trend_level || null,
      reason: analysisData.reason || null,
      related_trend: analysisData.related_trend || null,
      current_usage: analysisData.current_usage || null,
      recommendation: analysisData.recommendation || null
    };

    console.log('Attempting to insert product with data:', {
      ...productInsertData,
      image_url: '[base64 data]',
      insights: `${productInsertData.insights.length} insights`,
      sources: `${productInsertData.sources.length} sources`
    });

    // Save product analysis to database
    const { data: productData, error: productError } = await supabase
      .from('analysis_products')
      .insert(productInsertData)
      .select()
      .single();

    if (productError) {
      console.error('Error saving product:', productError);
      console.error('Product error details:', JSON.stringify(productError, null, 2));
      throw new Error(`Failed to save product analysis: ${productError.message}`);
    }

    console.log('Product analysis saved:', productData.id);

    // Generate embeddings automatically after product analysis
    try {
      console.log('Generating embeddings for product:', productData.id);
      const { error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: { 
          imageUrl: imageBase64,
          imageHash: hashHex,
          productId: productData.id
        }
      });

      if (embeddingError) {
        console.error('Error generating embeddings:', embeddingError);
        // Don't fail the entire analysis if embeddings fail
      } else {
        console.log('Embeddings generated successfully');
      }
    } catch (embeddingError) {
      console.error('Failed to generate embeddings:', embeddingError);
      // Continue without embeddings
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...analysisData,
          product_id: productData.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-product:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
