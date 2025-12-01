import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Users, Phone, Handshake, Calendar, CheckCircle, DollarSign } from "lucide-react";
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
  percentualConversao: number | null;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
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
        percentualConversao: null,
        icon: <Users className="h-6 w-6" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      },
      {
        nome: "Prospecção",
        atual: atual.prospeccao,
        anterior: anterior.prospeccao,
        percentualConversao: safeDiv(atual.prospeccao, atual.leads_recebido),
        icon: <Phone className="h-6 w-6" />,
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      },
      {
        nome: "Conexão",
        atual: atual.conexao,
        anterior: anterior.conexao,
        percentualConversao: safeDiv(atual.conexao, atual.prospeccao),
        icon: <Handshake className="h-6 w-6" />,
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
      },
      {
        nome: "Reuniões Marcadas",
        atual: atual.reunioes_marcadas,
        anterior: anterior.reunioes_marcadas,
        percentualConversao: safeDiv(atual.reunioes_marcadas, atual.conexao),
        icon: <Calendar className="h-6 w-6" />,
        color: "text-amber-600",
        bgColor: "bg-amber-100"
      },
      {
        nome: "Reuniões Realizadas",
        atual: atual.reunioes_realizadas,
        anterior: anterior.reunioes_realizadas,
        percentualConversao: safeDiv(atual.reunioes_realizadas, atual.reunioes_marcadas),
        icon: <CheckCircle className="h-6 w-6" />,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100"
      },
      {
        nome: "Vendas",
        atual: atual.vendas,
        anterior: anterior.vendas,
        percentualConversao: safeDiv(atual.vendas, atual.reunioes_realizadas),
        icon: <DollarSign className="h-6 w-6" />,
        color: "text-green-600",
        bgColor: "bg-green-100"
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
          <span className="text-sm font-semibold">+{variacaoFormatada}%</span>
        </div>
      );
    }
    if (atual < anterior) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-semibold">-{variacaoFormatada}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-semibold">0%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metricas = data 
    ? calcularMetricas(data.semana_atual, data.semana_anterior)
    : [];

  const topRow = metricas.slice(0, 3);
  const bottomRow = metricas.slice(3, 6);

  const MetricCard = ({ metrica }: { metrica: MetricaFunil }) => (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{metrica.nome}</p>
            <p className="text-3xl font-bold tracking-tight">{metrica.atual.toLocaleString('pt-BR')}</p>
            {metrica.percentualConversao !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Conv: {metrica.percentualConversao.toFixed(1)}%
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", metrica.bgColor)}>
            <div className={metrica.color}>
              {metrica.icon}
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 right-4">
          {getTrendDisplay(metrica.atual, metrica.anterior)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funil Comercial - Semana W{currentWeek}</h2>
          <p className="text-sm text-muted-foreground">Comparativo com W{currentWeek - 1}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topRow.map((metrica) => (
          <MetricCard key={metrica.nome} metrica={metrica} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bottomRow.map((metrica) => (
          <MetricCard key={metrica.nome} metrica={metrica} />
        ))}
      </div>
    </div>
  );
}
