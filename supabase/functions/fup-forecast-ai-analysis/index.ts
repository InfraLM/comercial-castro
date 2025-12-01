import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weekData, currentWeek } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é um analista de vendas especializado em análise de funil comercial. 
Analise os dados fornecidos comparando a semana atual com a semana anterior e forneça insights acionáveis.
Foque em: tendências, pontos de atenção, oportunidades de melhoria, e recomendações estratégicas.
Seja objetivo, use números concretos, e organize a análise em "HIGHS" (pontos positivos) e "LOWS" (pontos de atenção).
Cada ponto deve ser uma frase concisa e acionável.`;

    const userPrompt = `Analise os dados da semana ${currentWeek}:

DADOS DA SEMANA ATUAL:
${JSON.stringify(weekData.semana_atual, null, 2)}

DADOS DA SEMANA ANTERIOR:
${JSON.stringify(weekData.semana_anterior, null, 2)}

Forneça a análise no formato JSON:
{
  "highs": ["insight 1", "insight 2", ...],
  "lows": ["ponto de atenção 1", "ponto de atenção 2", ...]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erro Lovable AI:", response.status, errorText);
      throw new Error("Erro ao chamar Lovable AI");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";
    
    // Tentar extrair JSON do conteúdo
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { highs: [], lows: [] };
    } catch {
      analysis = { highs: [], lows: [] };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na análise:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
