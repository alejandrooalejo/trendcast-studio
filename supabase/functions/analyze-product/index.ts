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

    const systemPrompt = `Você é um especialista em análise de moda que avalia produtos comparando-os com tendências do mercado.
Analise a imagem do produto e compare com as tendências fornecidas para gerar insights acionáveis.`;

    const trendsSummary = `
TENDÊNCIAS DE CORES:
${trendingColors.map(c => `- ${c.name} (${c.hex_code}): ${c.reason} [Confiança: ${c.confidence_score}%]`).join('\n')}

TENDÊNCIAS DE TECIDOS:
${trendingFabrics.map(f => `- ${f.name} (${f.trend_percentage}): ${f.reason}`).join('\n')}

TENDÊNCIAS DE MODELAGEM:
${trendingModels.map(m => `- ${m.name} (${m.popularity}): ${m.description}`).join('\n')}
`;

    const userPrompt = `Analise este produto de moda na imagem e compare DETALHADAMENTE com as tendências fornecidas.
${category ? `Categoria: ${category}` : ''}
${sku ? `SKU: ${sku}` : ''}

${trendsSummary}

Forneça uma análise COMPLETA e ESPECÍFICA em JSON:
{
  "analysis_description": "Descrição visual detalhada do produto: cores, tecidos aparentes, modelagem, estilo, acabamentos visíveis",
  "detected_color": "Nome da cor + código hex (ex: 'Azul Marinho #1A3B5C')",
  "detected_fabric": "Tipo de tecido detectado visualmente",
  "detected_style": "Modelagem/corte identificado",
  "alignment_score": 85,
  "demand_projection": 72,
  "score_justification": "Justificativa DETALHADA do score de demanda explicando: (1) Como cada aspecto (cor, tecido, modelagem) foi avaliado, (2) Quais tendências específicas foram comparadas, (3) Por que recebeu este score",
  "risk_level": "low/medium/high",
  "insights": [
    {
      "type": "positive/negative/improvement",
      "title": "Título claro e direto",
      "description": "Explicação detalhada do insight com dados concretos",
      "impact": "high/medium/low"
    }
  ],
  "improvements": [
    {
      "aspect": "cor/tecido/modelagem/acabamento",
      "current": "O que está no produto AGORA",
      "suggested": "O que DEVERIA ser para alinhar com tendências",
      "reason": "Justificativa ESPECÍFICA baseada nas tendências fornecidas",
      "trend_alignment": 85
    }
  ],
  "comparison": {
    "color_match": 90,
    "fabric_match": 75,
    "style_match": 80,
    "overall_trend_alignment": 82
  }
}

REGRAS CRÍTICAS:
1. analysis_description: Descreva DETALHADAMENTE o que você vê na imagem
2. alignment_score (0-100): Quanto o produto atual está alinhado com as tendências listadas
3. demand_projection (0-100): Projeção realista de demanda considerando:
   - Alinhamento de cor com cores em alta (peso: 35%)
   - Alinhamento de tecido com materiais trending (peso: 30%)
   - Alinhamento de estilo com modelagens populares (peso: 35%)
4. score_justification: Explique DETALHADAMENTE como você calculou o score, cite tendências específicas
5. risk_level: 
   - "low" se demand_projection > 75
   - "medium" se demand_projection 50-75
   - "high" se demand_projection < 50
6. Insights: Forneça 3-5 insights CONCRETOS, não genéricos
7. Improvements: Liste 2-4 melhorias ACIONÁVEIS baseadas nas tendências REAIS fornecidas
8. Comparison: Compare CADA aspecto do produto com CADA tendência relevante fornecida

IMPORTANTE: Use os dados REAIS das tendências fornecidas, não invente tendências genéricas!`;

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
        temperature: 0.7,
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
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Save product analysis to database
    const { data: productData, error: productError } = await supabase
      .from('analysis_products')
      .insert({
        analysis_id: analysisId,
        image_url: imageBase64, // Store full base64 image
        sku: sku || null,
        category: category || null,
        color: analysisData.detected_color,
        fabric: analysisData.detected_fabric,
        demand_score: analysisData.demand_projection,
        risk_level: analysisData.risk_level,
        insights: analysisData.insights || [],
        analysis_description: analysisData.analysis_description || null,
        score_justification: analysisData.score_justification || null
      })
      .select()
      .single();

    if (productError) {
      console.error('Error saving product:', productError);
      throw new Error('Failed to save product analysis');
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
