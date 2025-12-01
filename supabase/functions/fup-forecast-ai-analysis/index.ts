import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FunilSemana {
  leads_recebido: number;
  prospeccao: number;
  conexao: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
  vendas: number;
}

interface SDRProdutividadeItem {
  reunioes_marcadas: number;
  reunioes_realizadas: number;
}

interface CloserItem {
  reunioes_realizadas: number;
  vendas: number;
}

interface WeekData {
  semana_atual: FunilSemana;
  semana_anterior: FunilSemana;
  produtividade?: {
    semana_atual?: SDRProdutividadeItem[];
  };
  closers?: CloserItem[];
}

interface Analysis {
  highs: string[];
  lows: string[];
}

function buildFallbackAnalysis(weekData: WeekData): Analysis {
  const highs: string[] = [];
  const lows: string[] = [];

  const atual = weekData.semana_atual;
  const anterior = weekData.semana_anterior;

  // Taxa de conversão geral
  const taxaConversaoAtual = atual.reunioes_realizadas > 0
    ? (atual.vendas / atual.reunioes_realizadas) * 100
    : 0;
  const taxaConversaoAnterior = anterior.reunioes_realizadas > 0
    ? (anterior.vendas / anterior.reunioes_realizadas) * 100
    : 0;

  if (taxaConversaoAtual > taxaConversaoAnterior && taxaConversaoAtual > 0) {
    highs.push(
      `Taxa de conversão geral subiu de ${taxaConversaoAnterior.toFixed(1)}% para ${taxaConversaoAtual.toFixed(1)}%, indicando maior eficiência nas reuniões.`,
    );
  } else if (taxaConversaoAtual < taxaConversaoAnterior && taxaConversaoAnterior > 0) {
    lows.push(
      `Taxa de conversão geral caiu de ${taxaConversaoAnterior.toFixed(1)}% para ${taxaConversaoAtual.toFixed(1)}%, sugerindo atenção à qualidade das reuniões.`,
    );
  }

  // Vendas totais
  if (atual.vendas > anterior.vendas) {
    const aumento = anterior.vendas > 0
      ? ((atual.vendas - anterior.vendas) / anterior.vendas) * 100
      : 100;
    highs.push(
      `Vendas totais cresceram de ${anterior.vendas} para ${atual.vendas} (+${aumento.toFixed(1)}%), mostrando aceleração no fechamento.`,
    );
  } else if (atual.vendas < anterior.vendas) {
    const queda = anterior.vendas > 0
      ? ((anterior.vendas - atual.vendas) / anterior.vendas) * 100
      : 0;
    lows.push(
      `Vendas totais recuaram de ${anterior.vendas} para ${atual.vendas} (-${queda.toFixed(1)}%), impactando o resultado da semana.`,
    );
  }

  // Leads recebidos
  if (atual.leads_recebido > anterior.leads_recebido) {
    highs.push(
      `Volume de leads aumentou de ${anterior.leads_recebido} para ${atual.leads_recebido}, abrindo mais oportunidades no topo do funil.`,
    );
  } else if (atual.leads_recebido < anterior.leads_recebido) {
    lows.push(
      `Leads recebidos caíram de ${anterior.leads_recebido} para ${atual.leads_recebido}, reduzindo o potencial de geração de novas vendas.`,
    );
  }

  // No-show (a partir da produtividade SDR)
  const sdrDataAtual = weekData.produtividade?.semana_atual ?? [];
  if (sdrDataAtual.length > 0) {
    const totais = sdrDataAtual.reduce(
      (acc, item) => ({
        reunioes_marcadas: acc.reunioes_marcadas + item.reunioes_marcadas,
        reunioes_realizadas: acc.reunioes_realizadas + item.reunioes_realizadas,
      }),
      { reunioes_marcadas: 0, reunioes_realizadas: 0 },
    );

    const taxaNoShow = totais.reunioes_marcadas > 0
      ? ((totais.reunioes_marcadas - totais.reunioes_realizadas) / totais.reunioes_marcadas) * 100
      : 0;

    if (taxaNoShow >= 25) {
      lows.push(
        `Taxa de no-show elevada em ${taxaNoShow.toFixed(1)}%, acima da meta ideal, exigindo ações de confirmação e qualificação.`,
      );
    } else if (taxaNoShow > 0 && taxaNoShow < 20) {
      highs.push(
        `Taxa de no-show controlada em ${taxaNoShow.toFixed(1)}%, dentro de um patamar saudável para o funil.`,
      );
    }
  }

  // Conversão dos closers
  const closers = weekData.closers ?? [];
  if (closers.length > 0) {
    const totais = closers.reduce(
      (acc, item) => ({
        reunioes_realizadas: acc.reunioes_realizadas + item.reunioes_realizadas,
        vendas: acc.vendas + item.vendas,
      }),
      { reunioes_realizadas: 0, vendas: 0 },
    );

    const taxaConversaoCloser = totais.reunioes_realizadas > 0
      ? (totais.vendas / totais.reunioes_realizadas) * 100
      : 0;

    if (taxaConversaoCloser >= 25) {
      highs.push(
        `Closers com forte desempenho: ${totais.vendas} vendas em ${totais.reunioes_realizadas} reuniões (${taxaConversaoCloser.toFixed(1)}% de conversão).`,
      );
    } else if (taxaConversaoCloser > 0 && taxaConversaoCloser < 20) {
      lows.push(
        `Conversão dos closers em ${taxaConversaoCloser.toFixed(1)}% (${totais.vendas} vendas em ${totais.reunioes_realizadas} reuniões), abaixo do patamar ideal.`,
      );
    }
  }

  if (highs.length === 0) {
    highs.push("Análise em andamento - dados ainda não mostram pontos fortes claros nesta semana.");
  }

  if (lows.length === 0) {
    lows.push("Nenhum ponto de atenção crítico evidente; manter o ritmo atual e acompanhar tendências.");
  }

  return { highs, lows };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weekData, currentWeek } = await req.json() as { weekData: WeekData; currentWeek: number };
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
${weekData.produtividade ? `Total de SDRs ativos: ${weekData.produtividade.semana_atual?.length || 0}` : ""}
${weekData.closers ? `Total de Closers ativos: ${weekData.closers.length}` : ""}

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errorText = await response.text();
      console.error("Erro Lovable AI:", response.status, errorText);
      throw new Error("Erro ao chamar Lovable AI");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";
    console.log("fup-forecast-ai-analysis - raw content:", content);

    let analysis: Analysis;

    try {
      analysis = JSON.parse(content) as Analysis;
    } catch {
      try {
        const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) as Analysis : { highs: [], lows: [] };
      } catch {
        analysis = { highs: [], lows: [] };
      }
    }

    // Se a IA não retornar nada útil, usar análise fallback baseada em regras
    if (!analysis.highs || analysis.highs.length === 0 || !analysis.lows || analysis.lows.length === 0) {
      analysis = buildFallbackAnalysis(weekData);
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro na análise:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
