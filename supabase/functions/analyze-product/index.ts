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

    const systemPrompt = `Você é um especialista em análise de moda que avalia produtos usando um método objetivo e consistente.
Você DEVE ser determinístico: a mesma imagem SEMPRE deve gerar os mesmos scores.
Use critérios objetivos e mensuráveis para garantir consistência.`;

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
METODOLOGIA DE CÁLCULO (USAR SEMPRE):
Para garantir consistência, siga EXATAMENTE estes critérios objetivos:

1. ANÁLISE DE COR (Peso: 35% do score final):
   Cores disponíveis para comparação:
   ${colorMatchData.map(c => `   - ${c.name} (${c.hex}): ${c.confidence}% confiança, ${c.appearances} aparições`).join('\n')}
   
   Calcule color_match (0-100):
   - Cor idêntica à tendência principal: 100 pontos
   - Cor similar (mesma família): 80-90 pontos
   - Cor complementar: 60-70 pontos
   - Cor fora das tendências: 30-50 pontos
   - Cor oposta às tendências: 0-20 pontos

2. ANÁLISE DE TECIDO (Peso: 30% do score final):
   Tecidos em tendência:
   ${fabricMatchData.map(f => `   - ${f.name}: ${f.percentage}, ${f.appearances} aparições`).join('\n')}
   
   Calcule fabric_match (0-100):
   - Tecido exato da tendência principal: 100 pontos
   - Tecido da mesma categoria: 75-85 pontos
   - Tecido neutro/versátil: 50-65 pontos
   - Tecido fora das tendências: 20-40 pontos

3. ANÁLISE DE MODELAGEM (Peso: 35% do score final):
   Modelagens populares:
   ${modelMatchData.map(m => `   - ${m.name} (${m.popularity}): ${m.appearances} aparições`).join('\n')}
   
   Calcule style_match (0-100):
   - Modelagem idêntica à tendência principal: 100 pontos
   - Modelagem similar: 80-90 pontos
   - Modelagem atemporal/clássica: 60-70 pontos
   - Modelagem desalinhada: 30-50 pontos
   - Modelagem oposta às tendências: 0-20 pontos

FÓRMULA OBRIGATÓRIA PARA demand_projection:
demand_projection = (color_match × 0.35) + (fabric_match × 0.30) + (style_match × 0.35)

FONTES DE DADOS UTILIZADAS:
${Array.from(sourceDataMap.entries()).map(([source, count]) => `- ${source}: ${count} pontos de dados`).join('\n')}
`;

    const userPrompt = `Analise este produto de moda na imagem usando a METODOLOGIA OBJETIVA fornecida.
${category ? `Categoria: ${category}` : ''}
${sku ? `SKU: ${sku}` : ''}

${trendsSummary}

INSTRUÇÕES CRÍTICAS PARA CONSISTÊNCIA:
- Você DEVE usar os critérios numéricos EXATOS fornecidos na metodologia
- Você DEVE calcular demand_projection usando a fórmula: (color_match × 0.35) + (fabric_match × 0.30) + (style_match × 0.35)
- Você DEVE ser objetivo: mesma imagem = mesmos scores SEMPRE
- Você DEVE explicitar no JSON EXATAMENTE qual tendência foi usada para cada cálculo

Forneça uma análise em JSON com esta estrutura OBRIGATÓRIA:
{
  "analysis_description": "Descrição visual objetiva: cores exatas vistas, tecido aparente, modelagem específica",
  "detected_color": "Nome da cor + código hex aproximado (ex: 'Azul Marinho #1A3B5C')",
  "detected_fabric": "Tipo de tecido detectado visualmente",
  "detected_style": "Modelagem/corte identificado",
  "estimated_market_price": 89.90,
  "estimated_production_cost": 35.50,
  "sources": [
    {"source": "Nome da Fonte", "count": número_exato_da_metodologia}
  ],
  "risk_level": "low/medium/high",
  "comparison": {
    "color_match": 90,
    "color_reasoning": "OBRIGATÓRIO: Explique o score baseado nos critérios da metodologia. Ex: 'Cor azul marinho idêntica à tendência #1 (Azul Marinho #1A3B5C, 95% confiança) = 100 pontos'",
    "fabric_match": 75,
    "fabric_reasoning": "OBRIGATÓRIO: Explique o score. Ex: 'Malha de algodão similar à tendência principal (Malha Sustentável, 85% das aparições) = 85 pontos'",
    "style_match": 80,
    "style_reasoning": "OBRIGATÓRIO: Explique o score. Ex: 'Corte oversized idêntico à tendência #2 (Oversized, alta popularidade) = 95 pontos'",
    "overall_trend_alignment": 82
  },
  "demand_projection": 0,
  "demand_calculation": "OBRIGATÓRIO: Mostre o cálculo EXATO: (90 × 0.35) + (75 × 0.30) + (80 × 0.35) = 82.0",
  "insights": [
    {
      "type": "positive/negative/improvement",
      "title": "Título claro",
      "description": "Insight ESPECÍFICO com dados: qual tendência, quantas aparições, qual o impacto",
      "impact": "high/medium/low",
      "supporting_data": "Referência à tendência específica usada"
    }
  ],
  "improvements": [
    {
      "aspect": "cor/tecido/modelagem",
      "current": "O que está no produto",
      "suggested": "Tendência específica a seguir (nome + dados)",
      "reason": "Por que esta mudança aumentaria o score (mostre o cálculo)",
      "potential_score_increase": "Ex: de 75 para 95 pontos em fabric_match"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
1. Use os critérios NUMÉRICOS da metodologia para calcular cada match score
2. O demand_projection DEVE ser calculado com a fórmula fornecida
3. Inclua "reasoning" para CADA score de comparação
4. Inclua "demand_calculation" mostrando a matemática exata
5. Cada insight DEVE referenciar dados específicos das tendências
6. Cada improvement DEVE mostrar o impacto numérico no score
7. Use os valores EXATOS de "FONTES DE DADOS" no campo sources
8. risk_level baseado em: demand_projection > 75 = "low", 50-75 = "medium", < 50 = "high"
9. estimated_market_price: Considere categoria${category ? ` "${category}"` : ''}, qualidade e alinhamento com tendências
10. estimated_production_cost: Análise REALISTA baseada em materiais e complexidade visíveis (considere mercado brasileiro de confecção)

IMPORTANTE: Sendo objetivo e usando sempre os mesmos critérios, a mesma imagem SEMPRE gerará os mesmos scores!`;

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
    const demandScore = Number.isFinite(rawDemandScore) ? Math.round(rawDemandScore) : 0;
    const estimatedPrice = Number(analysisData.estimated_market_price ?? 0) || 0;
    const productionCost = Number(analysisData.estimated_production_cost ?? 0) || 0;
    
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

    // Build score justification from the comparison data
    const scoreJustification = analysisData.demand_calculation || 
      `Score baseado em: Cor (${analysisData.comparison?.color_match || 0}), Tecido (${analysisData.comparison?.fabric_match || 0}), Modelagem (${analysisData.comparison?.style_match || 0})`;

    console.log(`Calculated recommended quantity: ${recommendedQuantity} for demand score: ${demandScore}`);
    console.log(`Target audience size: ${targetAudienceSize} (conversion rate: ${conversionRate * 100}%)`);
    console.log(`Estimated price: R$ ${estimatedPrice.toFixed(2)}, Production cost: R$ ${productionCost.toFixed(2)}`);
    console.log(`Projected revenue: R$ ${projectedRevenue.toFixed(2)}, Profit margin: ${profitMargin.toFixed(1)}%`);

    // Prepare product data for insertion
    const productInsertData = {
      analysis_id: analysisId,
      image_url: imageBase64,
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
      estimated_production_cost: productionCost
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
