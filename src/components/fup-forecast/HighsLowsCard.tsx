import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { useFunilComercial, useProdutividadeSDR, useConversaoCloser } from "@/hooks/useFupForecast";
import { cn } from "@/lib/utils";

interface HighsLowsCardProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

// Função de análise local baseada em dados (sem IA)
function buildLocalAnalysis(funilData: any, produtividadeData: any, closerData: any) {
  const highs: string[] = [];
  const lows: string[] = [];

  if (!funilData) return { highs: ["Dados insuficientes"], lows: ["Dados insuficientes"] };

  const atual = funilData.semana_atual;
  const anterior = funilData.semana_anterior;

  // Taxa de conversão reuniões
  const taxaConversaoAtual = atual.reunioes_marcadas > 0 
    ? (atual.reunioes_realizadas / atual.reunioes_marcadas) * 100 : 0;
  const taxaConversaoAnterior = anterior.reunioes_marcadas > 0 
    ? (anterior.reunioes_realizadas / anterior.reunioes_marcadas) * 100 : 0;

  if (taxaConversaoAtual > taxaConversaoAnterior) {
    highs.push(`Taxa de conversão de reuniões melhorou: ${taxaConversaoAtual.toFixed(1)}% vs ${taxaConversaoAnterior.toFixed(1)}%`);
  } else if (taxaConversaoAtual < taxaConversaoAnterior) {
    lows.push(`Taxa de conversão de reuniões caiu: ${taxaConversaoAtual.toFixed(1)}% vs ${taxaConversaoAnterior.toFixed(1)}%`);
  }

  // Vendas
  if (atual.vendas > anterior.vendas) {
    highs.push(`Vendas aumentaram: ${atual.vendas} vs ${anterior.vendas} da semana anterior`);
  } else if (atual.vendas < anterior.vendas) {
    lows.push(`Vendas diminuíram: ${atual.vendas} vs ${anterior.vendas} da semana anterior`);
  }

  // Leads
  if (atual.leads_recebido > anterior.leads_recebido) {
    highs.push(`Volume de leads aumentou: ${atual.leads_recebido} recebidos`);
  } else if (atual.leads_recebido < anterior.leads_recebido) {
    lows.push(`Volume de leads diminuiu: ${atual.leads_recebido} vs ${anterior.leads_recebido}`);
  }

  // No-show rate
  const noShowAtual = atual.reunioes_marcadas > 0 
    ? ((atual.reunioes_marcadas - atual.reunioes_realizadas) / atual.reunioes_marcadas) * 100 : 0;
  const noShowAnterior = anterior.reunioes_marcadas > 0 
    ? ((anterior.reunioes_marcadas - anterior.reunioes_realizadas) / anterior.reunioes_marcadas) * 100 : 0;

  if (noShowAtual < noShowAnterior) {
    highs.push(`Taxa de no-show melhorou: ${noShowAtual.toFixed(1)}% vs ${noShowAnterior.toFixed(1)}%`);
  } else if (noShowAtual > noShowAnterior) {
    lows.push(`Taxa de no-show aumentou: ${noShowAtual.toFixed(1)}% vs ${noShowAnterior.toFixed(1)}%`);
  }

  // Garantir pelo menos um item em cada lista
  if (highs.length === 0) highs.push("Dados estáveis em relação à semana anterior");
  if (lows.length === 0) lows.push("Sem pontos críticos identificados nesta semana");

  return { highs, lows };
}

export function HighsLowsCard({ weekRange, previousWeekRange, currentWeek }: HighsLowsCardProps) {
  const { data: funilData, isLoading: funilLoading } = useFunilComercial({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
  
  const { data: produtividadeData, isLoading: produtividadeLoading } = useProdutividadeSDR({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
  const { data: closerData, isLoading: closerLoading } = useConversaoCloser(weekRange.inicio, weekRange.fim);

  const isLoading = funilLoading || produtividadeLoading || closerLoading;

  // Análise local (sem IA) - temporariamente desabilitada
  const analysis = buildLocalAnalysis(funilData, produtividadeData, closerData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Carregando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const highs = analysis.highs;
  const lows = analysis.lows;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Análise Semanal - W{currentWeek}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* HIGHS */}
          <div className={cn(
            "rounded-lg p-4 border",
            "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
          )}>
            <h3 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5" />
              HIGHS
            </h3>
            <ul className="space-y-2">
              {highs.map((high, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>{high}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* LOWS */}
          <div className={cn(
            "rounded-lg p-4 border",
            "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
          )}>
            <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5" />
              LOWS
            </h3>
            <ul className="space-y-2">
              {lows.map((low, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{low}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
