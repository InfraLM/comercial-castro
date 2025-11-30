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
  percentualAnterior: number | null;
  metaAtual: number | null;
  metaAnterior: number | null;
}

export function FunilComercialCard({ weekRange, previousWeekRange, currentWeek }: FunilComercialCardProps) {
  const { data, isLoading, error } = useFunilComercial({
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
        percentualAtual: null,
        percentualAnterior: null,
        metaAtual: null,
        metaAnterior: null
      },
      {
        nome: "Prospecção",
        atual: atual.prospeccao,
        anterior: anterior.prospeccao,
        percentualAtual: safeDiv(atual.prospeccao, atual.leads_recebido),
        percentualAnterior: safeDiv(anterior.prospeccao, anterior.leads_recebido),
        metaAtual: 100,
        metaAnterior: 100
      },
      {
        nome: "Conexão",
        atual: atual.conexao,
        anterior: anterior.conexao,
        percentualAtual: safeDiv(atual.conexao, atual.prospeccao),
        percentualAnterior: safeDiv(anterior.conexao, anterior.prospeccao),
        metaAtual: safeDiv(atual.conexao, atual.leads_recebido),
        metaAnterior: safeDiv(anterior.conexao, anterior.leads_recebido)
      },
      {
        nome: "Reuniões Marcadas",
        atual: atual.reunioes_marcadas,
        anterior: anterior.reunioes_marcadas,
        percentualAtual: safeDiv(atual.reunioes_marcadas, atual.conexao),
        percentualAnterior: safeDiv(anterior.reunioes_marcadas, anterior.conexao),
        metaAtual: safeDiv(atual.reunioes_marcadas, atual.leads_recebido),
        metaAnterior: safeDiv(anterior.reunioes_marcadas, anterior.leads_recebido)
      },
      {
        nome: "Reuniões Realizadas",
        atual: atual.reunioes_realizadas,
        anterior: anterior.reunioes_realizadas,
        percentualAtual: safeDiv(atual.reunioes_realizadas, atual.reunioes_marcadas),
        percentualAnterior: safeDiv(anterior.reunioes_realizadas, anterior.reunioes_marcadas),
        metaAtual: safeDiv(atual.reunioes_realizadas, atual.leads_recebido),
        metaAnterior: safeDiv(anterior.reunioes_realizadas, anterior.leads_recebido)
      },
      {
        nome: "Vendas",
        atual: atual.vendas,
        anterior: anterior.vendas,
        percentualAtual: safeDiv(atual.vendas, atual.reunioes_realizadas),
        percentualAnterior: safeDiv(anterior.vendas, anterior.reunioes_realizadas),
        metaAtual: safeDiv(atual.vendas, atual.leads_recebido),
        metaAnterior: safeDiv(anterior.vendas, anterior.leads_recebido)
      }
    ];
  };

  const getTrendIcon = (atual: number, anterior: number) => {
    if (atual > anterior) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (atual < anterior) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
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
          Funil Comercial - Comparativo Semanal
        </CardTitle>
        <CardDescription>
          W{currentWeek - 1} vs W{currentWeek}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Métrica</TableHead>
                <TableHead className="text-center">W{currentWeek - 1}</TableHead>
                <TableHead className="text-center">% W{currentWeek - 1}</TableHead>
                <TableHead className="text-center">W{currentWeek}</TableHead>
                <TableHead className="text-center">% W{currentWeek}</TableHead>
                <TableHead className="text-center">Meta W{currentWeek - 1}</TableHead>
                <TableHead className="text-center">Meta W{currentWeek}</TableHead>
                <TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricas.map((metrica, index) => (
                <TableRow key={metrica.nome}>
                  <TableCell className="font-medium">{metrica.nome}</TableCell>
                  <TableCell className="text-center">{metrica.anterior.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    {metrica.percentualAnterior !== null ? `${metrica.percentualAnterior.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center font-semibold">{metrica.atual.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className={cn(
                    "text-center",
                    metrica.percentualAtual !== null && metrica.percentualAnterior !== null && 
                    metrica.percentualAtual > metrica.percentualAnterior && "text-emerald-600",
                    metrica.percentualAtual !== null && metrica.percentualAnterior !== null && 
                    metrica.percentualAtual < metrica.percentualAnterior && "text-red-600"
                  )}>
                    {metrica.percentualAtual !== null ? `${metrica.percentualAtual.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {metrica.metaAnterior !== null ? `${metrica.metaAnterior.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {metrica.metaAtual !== null ? `${metrica.metaAtual.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {index > 0 && getTrendIcon(metrica.atual, metrica.anterior)}
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
