import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  collectionType: string;
  collectionName: string;
  focusColors: boolean;
  focusFabrics: boolean;
  focusModels: boolean;
  analysisDepth: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { collectionType, collectionName, focusColors, focusFabrics, focusModels, analysisDepth }: AnalyzeRequest = await req.json();
    
    console.log('Starting trend analysis:', { collectionType, collectionName, analysisDepth });

    // Build analysis prompt based on user preferences
    const focusAreas = [];
    if (focusColors) focusAreas.push("cores e paletas de cores");
    if (focusFabrics) focusAreas.push("tecidos e materiais");
    if (focusModels) focusAreas.push("modelagens, cortes e silhuetas");

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
    {"name": "Nome da Cor", "hex": "#HEXCODE", "confidence": 95, "reason": "Por que está em alta"}
  ],
  "trending_fabrics": [
    {"name": "Nome do Tecido", "trend": "+X%", "reason": "Por que está crescendo"}
  ],
  "trending_models": [
    {"name": "Tipo de Modelagem", "popularity": "alta/média", "description": "Descrição breve"}
  ],
  "market_insights": [
    "Insight sobre o mercado atual"
  ],
  "recommendations": [
    "Recomendação específica para a coleção"
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.`;

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

    return new Response(
      JSON.stringify({ success: true, data: analysisData }),
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
