import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { useFunilComercial, useProdutividadeSDR, useConversaoCloser, useAIAnalysis } from "@/hooks/useFupForecast";
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
  
  const { data: produtividadeData, isLoading: produtividadeLoading } = useProdutividadeSDR({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
  const { data: closerData, isLoading: closerLoading } = useConversaoCloser(weekRange.inicio, weekRange.fim);

  const weekData = funilData ? {
    semana_atual: { ...funilData.semana_atual },
    semana_anterior: { ...funilData.semana_anterior },
    produtividade: produtividadeData,
    closers: closerData,
  } : null;

  const { data: aiAnalysis, isLoading: aiLoading } = useAIAnalysis(
    weekData,
    currentWeek,
    weekData !== null
  );

  const isLoading = funilLoading || produtividadeLoading || closerLoading;

  if (isLoading || aiLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {aiLoading ? "Analisando dados com IA..." : "Carregando..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Usar análise de IA
  const highs: string[] = aiAnalysis?.highs || ["Análise em andamento - dados sendo processados"];
  const lows: string[] = aiAnalysis?.lows || ["Aguardando análise completa dos dados"];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Análise Semanal com IA - W{currentWeek}
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
