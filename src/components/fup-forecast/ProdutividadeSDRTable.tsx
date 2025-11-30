import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutividadeSDR } from "@/hooks/useFupForecast";
import { formatTempo, getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { cn } from "@/lib/utils";

interface ProdutividadeSDRTableProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

export function ProdutividadeSDRTable({ data_inicio, data_fim, currentWeek }: ProdutividadeSDRTableProps) {
  const { data, isLoading } = useProdutividadeSDR(data_inicio, data_fim);
  const { getSdrName } = useUserMapping();

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

  const sdrData = data || [];
  
  // Calcular totais
  const totais = sdrData.reduce(
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
    if (marcadas === 0) return 0;
    return ((marcadas - realizadas) / marcadas) * 100;
  };

  const totalNoShow = calcNoShow(totais.reunioes_marcadas, totais.reunioes_realizadas);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtividade SDR - Semana W{currentWeek}</CardTitle>
        <CardDescription>
          Performance individual de cada SDR no período
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
                <TableHead className="text-center">% No Show</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrData.map((sdr) => {
                const noShow = calcNoShow(sdr.reunioes_marcadas, sdr.reunioes_realizadas);
                const noShowColor = getIndicatorColor('no_show', noShow);
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">{sdr.ligacoes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{formatTempo(sdr.tempo_segundos)}</TableCell>
                    <TableCell className="text-center">{sdr.whatsapp.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_marcadas}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-medium",
                        noShowColor === 'green' 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                      )}>
                        {noShow.toFixed(2)}% {noShowColor === 'green' ? '✅' : '❌'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{totais.ligacoes.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center">{formatTempo(totais.tempo_segundos)}</TableCell>
                <TableCell className="text-center">{totais.whatsapp.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center">{totais.reunioes_marcadas}</TableCell>
                <TableCell className="text-center">{totais.reunioes_realizadas}</TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "font-medium",
                    getIndicatorColor('no_show', totalNoShow) === 'green' 
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                  )}>
                    {totalNoShow.toFixed(2)}% {getIndicatorColor('no_show', totalNoShow) === 'green' ? '✅' : '❌'}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
