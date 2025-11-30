import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useFunilComercial, useProdutividadeSDR, useConversaoCloser } from "@/hooks/useFupForecast";
import { cn } from "@/lib/utils";

interface HighsLowsCardProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

export function HighsLowsCard({ weekRange, previousWeekRange, currentWeek }: HighsLowsCardProps) {
  const { data: funilData, isLoading: funilLoading } = useFunilComercial({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
  
  const { data: produtividadeData, isLoading: produtividadeLoading } = useProdutividadeSDR(weekRange.inicio, weekRange.fim);
  const { data: closerData, isLoading: closerLoading } = useConversaoCloser(weekRange.inicio, weekRange.fim);

  const isLoading = funilLoading || produtividadeLoading || closerLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calcular Highs e Lows automaticamente
  const highs: string[] = [];
  const lows: string[] = [];

  if (funilData) {
    const atual = funilData.semana_atual;
    const anterior = funilData.semana_anterior;

    // Taxa de conversão crescente
    const taxaConversaoAtual = atual.reunioes_realizadas > 0 
      ? (atual.vendas / atual.reunioes_realizadas) * 100 
      : 0;
    const taxaConversaoAnterior = anterior.reunioes_realizadas > 0 
      ? (anterior.vendas / anterior.reunioes_realizadas) * 100 
      : 0;

    if (taxaConversaoAtual > taxaConversaoAnterior && taxaConversaoAtual > 0) {
      highs.push(`Taxa de conversão aumentou de ${taxaConversaoAnterior.toFixed(1)}% para ${taxaConversaoAtual.toFixed(1)}%`);
    }

    // Aumento de vendas
    if (atual.vendas > anterior.vendas) {
      const aumento = anterior.vendas > 0 
        ? ((atual.vendas - anterior.vendas) / anterior.vendas * 100).toFixed(1)
        : '100';
      highs.push(`Aumento de ${aumento}% nas vendas (${anterior.vendas} → ${atual.vendas})`);
    }

    // Aumento de leads
    if (atual.leads_recebido > anterior.leads_recebido) {
      highs.push(`Leads recebidos aumentaram de ${anterior.leads_recebido} para ${atual.leads_recebido}`);
    }

    // Diminuição de reuniões realizadas
    if (atual.reunioes_realizadas < anterior.reunioes_realizadas) {
      lows.push(`Diminuição das reuniões realizadas em relação a semana anterior (${anterior.reunioes_realizadas} → ${atual.reunioes_realizadas})`);
    }

    // Diminuição de vendas
    if (atual.vendas < anterior.vendas) {
      lows.push(`Queda nas vendas em relação a semana anterior (${anterior.vendas} → ${atual.vendas})`);
    }

    // Taxa de conversão caindo
    if (taxaConversaoAtual < taxaConversaoAnterior && taxaConversaoAnterior > 0) {
      lows.push(`Taxa de conversão caiu de ${taxaConversaoAnterior.toFixed(1)}% para ${taxaConversaoAtual.toFixed(1)}%`);
    }
  }

  // Taxa de No Show alta
  if (produtividadeData && produtividadeData.length > 0) {
    const totais = produtividadeData.reduce(
      (acc, sdr) => ({
        reunioes_marcadas: acc.reunioes_marcadas + sdr.reunioes_marcadas,
        reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas
      }),
      { reunioes_marcadas: 0, reunioes_realizadas: 0 }
    );

    const taxaNoShow = totais.reunioes_marcadas > 0 
      ? ((totais.reunioes_marcadas - totais.reunioes_realizadas) / totais.reunioes_marcadas) * 100 
      : 0;

    if (taxaNoShow >= 25) {
      lows.push(`Taxa de no show acima da meta (${taxaNoShow.toFixed(1)}%)`);
    } else if (taxaNoShow < 20) {
      highs.push(`Taxa de no show abaixo de 20% (${taxaNoShow.toFixed(1)}%)`);
    }
  }

  // Taxa de conversão dos closers
  if (closerData && closerData.length > 0) {
    const totais = closerData.reduce(
      (acc, closer) => ({
        reunioes_realizadas: acc.reunioes_realizadas + closer.reunioes_realizadas,
        vendas: acc.vendas + closer.vendas
      }),
      { reunioes_realizadas: 0, vendas: 0 }
    );

    const taxaConversaoCloser = totais.reunioes_realizadas > 0 
      ? (totais.vendas / totais.reunioes_realizadas) * 100 
      : 0;

    if (taxaConversaoCloser >= 25) {
      highs.push(`Taxa de conversão dos Closers atingiu ${taxaConversaoCloser.toFixed(1)}%`);
    } else if (taxaConversaoCloser < 20) {
      lows.push(`Taxa de conversão dos Closers abaixo de 20% (${taxaConversaoCloser.toFixed(1)}%)`);
    }
  }

  // Adicionar mensagens padrão se não houver nenhum insight
  if (highs.length === 0) {
    highs.push("Análise em andamento - dados sendo coletados");
  }
  if (lows.length === 0) {
    lows.push("Nenhum ponto de atenção identificado nesta semana");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Highs & Lows - W{currentWeek}
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
