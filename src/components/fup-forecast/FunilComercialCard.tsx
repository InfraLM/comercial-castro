import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFunilComercial, FunilData } from "@/hooks/useFupForecast";
import { cn } from "@/lib/utils";

interface FunilComercialCardProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

interface MetricaFunil {
  nome: string;
  atual: number;
  anterior: number;
  percentualAtual: number | null;
}

export function FunilComercialCard({ weekRange, previousWeekRange, currentWeek }: FunilComercialCardProps) {
  const { data, isLoading } = useFunilComercial({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });

  const calcularMetricas = (atual: FunilData, anterior: FunilData): MetricaFunil[] => {
    const safeDiv = (a: number, b: number) => b === 0 ? 0 : (a / b) * 100;

    return [
      {
        nome: "Leads Recebidos",
        atual: atual.leads_recebido,
        anterior: anterior.leads_recebido,
        percentualAtual: null
      },
      {
        nome: "Prospecção",
        atual: atual.prospeccao,
        anterior: anterior.prospeccao,
        percentualAtual: safeDiv(atual.prospeccao, atual.leads_recebido)
      },
      {
        nome: "Conexão",
        atual: atual.conexao,
        anterior: anterior.conexao,
        percentualAtual: safeDiv(atual.conexao, atual.prospeccao)
      },
      {
        nome: "Reuniões Marcadas",
        atual: atual.reunioes_marcadas,
        anterior: anterior.reunioes_marcadas,
        percentualAtual: safeDiv(atual.reunioes_marcadas, atual.conexao)
      },
      {
        nome: "Reuniões Realizadas",
        atual: atual.reunioes_realizadas,
        anterior: anterior.reunioes_realizadas,
        percentualAtual: safeDiv(atual.reunioes_realizadas, atual.reunioes_marcadas)
      },
      {
        nome: "Vendas",
        atual: atual.vendas,
        anterior: anterior.vendas,
        percentualAtual: safeDiv(atual.vendas, atual.reunioes_realizadas)
      }
    ];
  };

  const calcularVariacao = (atual: number, anterior: number): number => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const getTrendDisplay = (atual: number, anterior: number) => {
    const variacao = calcularVariacao(atual, anterior);
    const variacaoFormatada = Math.abs(variacao).toFixed(1);
    
    if (atual > anterior) {
      return (
        <div className="flex items-center gap-1 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">+{variacaoFormatada}%</span>
        </div>
      );
    }
    if (atual < anterior) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-xs font-medium">-{variacaoFormatada}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-xs font-medium">0%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const metricas = data 
    ? calcularMetricas(data.semana_atual, data.semana_anterior)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Funil Comercial - Semana W{currentWeek}
        </CardTitle>
        <CardDescription>
          Comparativo com W{currentWeek - 1}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Métrica</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead className="text-center">% Conversão</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.map((metrica, index) => (
                <TableRow key={metrica.nome}>
                  <TableCell className="font-medium">{metrica.nome}</TableCell>
                  <TableCell className="text-center font-semibold">{metrica.atual.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    {metrica.percentualAtual !== null ? `${metrica.percentualAtual.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      {getTrendDisplay(metrica.atual, metrica.anterior)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
