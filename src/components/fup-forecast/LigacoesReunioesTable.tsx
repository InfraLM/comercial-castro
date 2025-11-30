import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutividadeSDR } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { cn } from "@/lib/utils";

interface LigacoesReunioesTableProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

export function LigacoesReunioesTable({ data_inicio, data_fim, currentWeek }: LigacoesReunioesTableProps) {
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
      reunioes_marcadas: acc.reunioes_marcadas + sdr.reunioes_marcadas,
      reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas
    }),
    { ligacoes: 0, reunioes_marcadas: 0, reunioes_realizadas: 0 }
  );

  const calcLigReuniaoM = (ligacoes: number, marcadas: number) => {
    if (marcadas === 0) return 0;
    return ligacoes / marcadas;
  };

  const calcLigReuniaoR = (ligacoes: number, realizadas: number) => {
    if (realizadas === 0) return 0;
    return ligacoes / realizadas;
  };

  const totalLigReuniaoM = calcLigReuniaoM(totais.ligacoes, totais.reunioes_marcadas);
  const totalLigReuniaoR = calcLigReuniaoR(totais.ligacoes, totais.reunioes_realizadas);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eficiência: Ligações por Reunião - W{currentWeek}</CardTitle>
        <CardDescription>
          Metas: &lt;15 ligações por reunião marcada | &lt;20 ligações por reunião realizada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">SDR</TableHead>
                <TableHead className="text-center">Ligações</TableHead>
                <TableHead className="text-center">Reuniões Marcadas</TableHead>
                <TableHead className="text-center">Reuniões Realizadas</TableHead>
                <TableHead className="text-center">Lig/Reunião M.</TableHead>
                <TableHead className="text-center">Lig/Reunião R.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrData.map((sdr) => {
                const ligReuniaoM = calcLigReuniaoM(sdr.ligacoes, sdr.reunioes_marcadas);
                const ligReuniaoR = calcLigReuniaoR(sdr.ligacoes, sdr.reunioes_realizadas);
                const colorM = getIndicatorColor('ligacoes_reuniao_m', ligReuniaoM);
                const colorR = getIndicatorColor('ligacoes_reuniao_r', ligReuniaoR);
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">{sdr.ligacoes.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_marcadas}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-medium",
                        colorM === 'green' 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                      )}>
                        {ligReuniaoM.toFixed(2)} {colorM === 'green' ? '✅' : '❌'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-medium",
                        colorR === 'green' 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                      )}>
                        {ligReuniaoR.toFixed(2)} {colorR === 'green' ? '✅' : '❌'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-center">{totais.ligacoes.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center">{totais.reunioes_marcadas}</TableCell>
                <TableCell className="text-center">{totais.reunioes_realizadas}</TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "font-medium",
                    getIndicatorColor('ligacoes_reuniao_m', totalLigReuniaoM) === 'green' 
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                  )}>
                    {totalLigReuniaoM.toFixed(2)} {getIndicatorColor('ligacoes_reuniao_m', totalLigReuniaoM) === 'green' ? '✅' : '❌'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "font-medium",
                    getIndicatorColor('ligacoes_reuniao_r', totalLigReuniaoR) === 'green' 
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                  )}>
                    {totalLigReuniaoR.toFixed(2)} {getIndicatorColor('ligacoes_reuniao_r', totalLigReuniaoR) === 'green' ? '✅' : '❌'}
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
