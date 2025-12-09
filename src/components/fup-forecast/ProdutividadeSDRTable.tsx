import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useProdutividadeSDR, SDRProdutividadeData } from "@/hooks/useFupForecast";
import { formatTempo } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface ProdutividadeSDRTableProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

export function ProdutividadeSDRTable({ weekRange, previousWeekRange, currentWeek }: ProdutividadeSDRTableProps) {
  const { data, isLoading } = useProdutividadeSDR({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
  const { getSdrName } = useUserMapping();

  const getTrendIcon = (atual: number, anterior: number, inverso: boolean = false) => {
    const subiu = atual > anterior;
    const desceu = atual < anterior;
    
    if (inverso) {
      // Para métricas inversas (No Show), descendo é bom (verde), subindo é ruim (vermelho)
      if (desceu) return <TrendingDown className="h-4 w-4 text-emerald-600" />;
      if (subiu) return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else {
      // Para métricas normais, subindo é bom (verde), descendo é ruim (vermelho)
      if (subiu) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      if (desceu) return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
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

  // Filtrar Murilo dos dados
  const sdrDataAtual = (data?.semana_atual || []).filter(sdr => 
    !sdr.sdr.toLowerCase().includes('murilo')
  );
  const sdrDataAnterior = (data?.semana_anterior || []).filter(sdr => 
    !sdr.sdr.toLowerCase().includes('murilo')
  );

  // Criar mapa da semana anterior para comparação
  const anteriorMap = new Map<string, SDRProdutividadeData>();
  sdrDataAnterior.forEach(sdr => {
    anteriorMap.set(sdr.sdr, sdr);
  });

  // Calcular totais
  const totaisAtual = sdrDataAtual.reduce(
    (acc, sdr) => ({
      ligacoes: acc.ligacoes + sdr.ligacoes,
      tempo_segundos: acc.tempo_segundos + sdr.tempo_segundos,
      whatsapp: acc.whatsapp + sdr.whatsapp,
      reunioes_marcadas: acc.reunioes_marcadas + sdr.reunioes_marcadas,
      reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas
    }),
    { ligacoes: 0, tempo_segundos: 0, whatsapp: 0, reunioes_marcadas: 0, reunioes_realizadas: 0 }
  );

  const totaisAnterior = sdrDataAnterior.reduce(
    (acc, sdr) => ({
      ligacoes: acc.ligacoes + sdr.ligacoes,
      tempo_segundos: acc.tempo_segundos + sdr.tempo_segundos,
      whatsapp: acc.whatsapp + sdr.whatsapp,
      reunioes_marcadas: acc.reunioes_marcadas + sdr.reunioes_marcadas,
      reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas
    }),
    { ligacoes: 0, tempo_segundos: 0, whatsapp: 0, reunioes_marcadas: 0, reunioes_realizadas: 0 }
  );

  const calcNoShow = (marcadas: number, realizadas: number) => {
    return marcadas - realizadas;
  };

  const calcNoShowPercent = (marcadas: number, realizadas: number) => {
    if (marcadas === 0) return 0;
    const noShow = marcadas - realizadas;
    return (noShow / marcadas) * 100;
  };

  const totalNoShowAtual = calcNoShow(totaisAtual.reunioes_marcadas, totaisAtual.reunioes_realizadas);
  const totalNoShowAnterior = calcNoShow(totaisAnterior.reunioes_marcadas, totaisAnterior.reunioes_realizadas);
  const totalNoShowPercentAtual = calcNoShowPercent(totaisAtual.reunioes_marcadas, totaisAtual.reunioes_realizadas);
  const totalNoShowPercentAnterior = calcNoShowPercent(totaisAnterior.reunioes_marcadas, totaisAnterior.reunioes_realizadas);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtividade SDR - Semana W{currentWeek}</CardTitle>
        <CardDescription>
          Performance individual de cada SDR no período (comparativo com W{currentWeek - 1})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">SDR</TableHead>
                <TableHead className="text-center">Ligações</TableHead>
                <TableHead className="text-center">Tempo</TableHead>
                <TableHead className="text-center">WhatsApp</TableHead>
                <TableHead className="text-center">Reuniões Marcadas</TableHead>
                <TableHead className="text-center">Reuniões Realizadas</TableHead>
                <TableHead className="text-center">No Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {sdrDataAtual.map((sdr) => {
                const anterior = anteriorMap.get(sdr.sdr) || { 
                  ligacoes: 0, tempo_segundos: 0, whatsapp: 0, 
                  reunioes_marcadas: 0, reunioes_realizadas: 0, sdr: sdr.sdr 
                };
                const noShowAtual = calcNoShow(sdr.reunioes_marcadas, sdr.reunioes_realizadas);
                const noShowPercentAtual = calcNoShowPercent(sdr.reunioes_marcadas, sdr.reunioes_realizadas);
                const noShowPercentAnterior = calcNoShowPercent(anterior.reunioes_marcadas, anterior.reunioes_realizadas);
                const variacaoPercent = noShowPercentAtual - noShowPercentAnterior;
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">{sdr.ligacoes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{formatTempo(sdr.tempo_segundos)}</TableCell>
                    <TableCell className="text-center">{sdr.whatsapp.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_marcadas}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{noShowAtual} ({noShowPercentAtual.toFixed(1)}%)</span>
                        <div className="flex items-center gap-1 text-xs">
                          {getTrendIcon(noShowPercentAtual, noShowPercentAnterior, true)}
                          <span className={variacaoPercent < 0 ? "text-emerald-600" : variacaoPercent > 0 ? "text-red-600" : "text-muted-foreground"}>
                            {variacaoPercent > 0 ? "+" : ""}{variacaoPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{totaisAtual.ligacoes.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center">{formatTempo(totaisAtual.tempo_segundos)}</TableCell>
                <TableCell className="text-center">{totaisAtual.whatsapp.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center">{totaisAtual.reunioes_marcadas}</TableCell>
                <TableCell className="text-center">{totaisAtual.reunioes_realizadas}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{totalNoShowAtual} ({totalNoShowPercentAtual.toFixed(1)}%)</span>
                    <div className="flex items-center gap-1 text-xs">
                      {getTrendIcon(totalNoShowPercentAtual, totalNoShowPercentAnterior, true)}
                      <span className={(totalNoShowPercentAtual - totalNoShowPercentAnterior) < 0 ? "text-emerald-600" : (totalNoShowPercentAtual - totalNoShowPercentAnterior) > 0 ? "text-red-600" : "text-muted-foreground"}>
                        {(totalNoShowPercentAtual - totalNoShowPercentAnterior) > 0 ? "+" : ""}{(totalNoShowPercentAtual - totalNoShowPercentAnterior).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
