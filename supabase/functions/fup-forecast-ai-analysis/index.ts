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
Analise os dados fornecidos comparando a semana atual com a semana anterior e forneça insights profundos e acionáveis.
Foque em: tendências, pontos de atenção, oportunidades de melhoria, e recomendações estratégicas.
Seja objetivo, use números concretos, e organize a análise em "HIGHS" (pontos positivos) e "LOWS" (pontos de atenção).

IMPORTANTE:
- Retorne entre 3-5 pontos em cada categoria (HIGHS e LOWS)
- Cada ponto deve ser uma frase concisa e acionável
- Use dados concretos e percentuais quando relevante
- Identifique padrões e tendências importantes
- Dê recomendações práticas e específicas`;

    const userPrompt = `Analise os dados da semana ${currentWeek} e compare com a semana anterior:

DADOS DA SEMANA ATUAL:
- Leads recebidos: ${weekData.semana_atual.leads_recebido}
- Prospecção: ${weekData.semana_atual.prospeccao}
- Conexão: ${weekData.semana_atual.conexao}
- Reuniões marcadas: ${weekData.semana_atual.reunioes_marcadas}
- Reuniões realizadas: ${weekData.semana_atual.reunioes_realizadas}
- Vendas: ${weekData.semana_atual.vendas}

DADOS DA SEMANA ANTERIOR:
- Leads recebidos: ${weekData.semana_anterior.leads_recebido}
- Prospecção: ${weekData.semana_anterior.prospeccao}
- Conexão: ${weekData.semana_anterior.conexao}
- Reuniões marcadas: ${weekData.semana_anterior.reunioes_marcadas}
- Reuniões realizadas: ${weekData.semana_anterior.reunioes_realizadas}
- Vendas: ${weekData.semana_anterior.vendas}

PRODUTIVIDADE E CLOSERS:
${weekData.produtividade ? `Total de SDRs ativos: ${weekData.produtividade.semana_atual?.length || 0}` : ''}
${weekData.closers ? `Total de Closers ativos: ${weekData.closers.length}` : ''}

Forneça uma análise completa no formato JSON. Retorne EXATAMENTE neste formato:
{
  "highs": ["insight positivo 1 com números", "insight positivo 2 com números", "insight positivo 3 com números"],
  "lows": ["ponto de atenção 1 com números", "ponto de atenção 2 com números", "ponto de atenção 3 com números"]
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
