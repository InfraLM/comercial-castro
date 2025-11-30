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
    const melhorou = inverso ? atual < anterior : atual > anterior;
    const piorou = inverso ? atual > anterior : atual < anterior;
    
    if (melhorou) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (piorou) return <TrendingDown className="h-4 w-4 text-red-600" />;
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

  const sdrDataAtual = data?.semana_atual || [];
  const sdrDataAnterior = data?.semana_anterior || [];

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

  const totalNoShowAtual = calcNoShow(totaisAtual.reunioes_marcadas, totaisAtual.reunioes_realizadas);
  const totalNoShowAnterior = calcNoShow(totaisAnterior.reunioes_marcadas, totaisAnterior.reunioes_realizadas);

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
                const noShowAnterior = calcNoShow(anterior.reunioes_marcadas, anterior.reunioes_realizadas);
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">{sdr.ligacoes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{formatTempo(sdr.tempo_segundos)}</TableCell>
                    <TableCell className="text-center">{sdr.whatsapp.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_marcadas}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{noShowAtual}</span>
                        {getTrendIcon(noShowAtual, noShowAnterior, true)}
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
                  <div className="flex items-center justify-center gap-2">
                    <span>{totalNoShowAtual}</span>
                    {getTrendIcon(totalNoShowAtual, totalNoShowAnterior, true)}
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
