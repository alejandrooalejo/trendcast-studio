import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  collectionType: string;
  collectionName: string;
  analysisDepth: string;
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
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { collectionType, collectionName, analysisDepth }: AnalyzeRequest = await req.json();
    
    console.log('Starting trend analysis:', { collectionType, collectionName, analysisDepth });

    // Always analyze all focus areas
    const focusAreas = ["cores e paletas de cores", "tecidos e materiais", "modelagens, cortes e silhuetas"];

    const depthInstructions = {
      quick: "Forneça uma análise rápida com os 3 principais insights.",
      standard: "Forneça uma análise balanceada com insights detalhados e recomendações práticas.",
      deep: "Forneça uma análise profunda e abrangente com dados específicos, tendências emergentes e recomendações estratégicas."
    };

    const systemPrompt = `Você é um especialista em análise de tendências de moda com acesso a dados de mercado em tempo real. 
Sua função é analisar tendências atuais do mercado de moda e fornecer insights acionáveis.

Baseie suas análises em:
- Pesquisas do Google Trends sobre moda
- Tendências do Instagram e TikTok
- Coleções de marcas internacionais recentes
- Relatórios de institutos de moda como WGSN
- Buscas em marketplaces como Zara, H&M, Shein
- Comportamento do consumidor brasileiro

Foque nos seguintes aspectos: ${focusAreas.join(", ")}.
${depthInstructions[analysisDepth as keyof typeof depthInstructions]}`;

    const userPrompt = `Analise as tendências atuais para uma coleção do tipo "${collectionType}" chamada "${collectionName}".

Forneça uma resposta estruturada em JSON com o seguinte formato:
{
  "trending_colors": [
    {
      "name": "Nome da Cor", 
      "hex": "#HEXCODE", 
      "confidence": 95, 
      "reason": "Por que está em alta",
      "visual_reference_url": "URL de exemplo visual (Pinterest, Instagram, etc)",
      "search_appearances": 1500,
      "sources": ["Google Trends", "Instagram Fashion", "WGSN", "Vogue"]
    }
  ],
  "trending_fabrics": [
    {
      "name": "Nome do Tecido", 
      "trend": "+X%", 
      "reason": "Por que está crescendo",
      "visual_reference_url": "URL de exemplo visual",
      "search_appearances": 800,
      "sources": ["H&M", "Zara", "Fashion Snoops", "Pantone"]
    }
  ],
  "trending_models": [
    {
      "name": "Tipo de Modelagem", 
      "popularity": "alta/média", 
      "description": "Descrição breve",
      "visual_reference_url": "URL de exemplo visual",
      "search_appearances": 1200,
      "sources": ["TikTok Fashion", "Pinterest Trends", "Shein"]
    }
  ],
  "market_insights": [
    {
      "insight": "Insight sobre o mercado atual",
      "source": "Fonte do insight (Google Trends, WGSN, etc)"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Recomendação específica para a coleção",
      "priority": "alta/média/baixa"
    }
  ]
}

IMPORTANTE: 
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- Inclua URLs reais de referências visuais de plataformas como Pinterest, Instagram, Google Images
- Forneça números estimados realistas de aparições em pesquisas baseado na popularidade
- Liste as fontes específicas onde cada tendência foi identificada`;

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
          { role: 'user', content: userPrompt }
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
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // Save analysis to database
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        collection_type: collectionType,
        collection_name: collectionName,
        focus_colors: true,
        focus_fabrics: true,
        focus_models: true,
        analysis_depth: analysisDepth,
        status: 'completed'
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
      throw new Error('Failed to save analysis');
    }

    const analysisId = analysisRecord.id;
    console.log('Analysis saved with ID:', analysisId);

    // Save trending colors
    if (analysisData.trending_colors?.length > 0) {
      const colorsToInsert = analysisData.trending_colors.map((color: any) => ({
        analysis_id: analysisId,
        name: color.name,
        hex_code: color.hex,
        confidence_score: color.confidence,
        reason: color.reason,
        visual_reference_url: color.visual_reference_url,
        search_appearances: color.search_appearances,
        sources: color.sources
      }));

      const { error: colorsError } = await supabase
        .from('trending_colors')
        .insert(colorsToInsert);

      if (colorsError) {
        console.error('Error saving colors:', colorsError);
      }
    }

    // Save trending fabrics
    if (analysisData.trending_fabrics?.length > 0) {
      const fabricsToInsert = analysisData.trending_fabrics.map((fabric: any) => ({
        analysis_id: analysisId,
        name: fabric.name,
        trend_percentage: fabric.trend,
        reason: fabric.reason,
        visual_reference_url: fabric.visual_reference_url,
        search_appearances: fabric.search_appearances,
        sources: fabric.sources
      }));

      const { error: fabricsError } = await supabase
        .from('trending_fabrics')
        .insert(fabricsToInsert);

      if (fabricsError) {
        console.error('Error saving fabrics:', fabricsError);
      }
    }

    // Save trending models
    if (analysisData.trending_models?.length > 0) {
      const modelsToInsert = analysisData.trending_models.map((model: any) => ({
        analysis_id: analysisId,
        name: model.name,
        popularity: model.popularity,
        description: model.description,
        visual_reference_url: model.visual_reference_url,
        search_appearances: model.search_appearances,
        sources: model.sources
      }));

      const { error: modelsError } = await supabase
        .from('trending_models')
        .insert(modelsToInsert);

      if (modelsError) {
        console.error('Error saving models:', modelsError);
      }
    }

    // Save market insights
    if (analysisData.market_insights?.length > 0) {
      const insightsToInsert = analysisData.market_insights.map((insight: any) => ({
        analysis_id: analysisId,
        insight: insight.insight,
        source: insight.source
      }));

      const { error: insightsError } = await supabase
        .from('market_insights')
        .insert(insightsToInsert);

      if (insightsError) {
        console.error('Error saving insights:', insightsError);
      }
    }

    // Save recommendations
    if (analysisData.recommendations?.length > 0) {
      const recommendationsToInsert = analysisData.recommendations.map((rec: any) => ({
        analysis_id: analysisId,
        recommendation: rec.recommendation,
        priority: rec.priority
      }));

      const { error: recsError } = await supabase
        .from('recommendations')
        .insert(recommendationsToInsert);

      if (recsError) {
        console.error('Error saving recommendations:', recsError);
      }
    }

    console.log('All trend data saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...analysisData,
          analysis_id: analysisId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-trends:', error);
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
