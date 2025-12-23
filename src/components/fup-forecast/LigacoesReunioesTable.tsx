import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutividadeSDR, SDRProdutividadeData } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface LigacoesReunioesTableProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

export function LigacoesReunioesTable({ weekRange, previousWeekRange, currentWeek }: LigacoesReunioesTableProps) {
  const { data, isLoading } = useProdutividadeSDR({
    data_inicio: weekRange.inicio,
    data_fim: weekRange.fim,
    data_inicio_anterior: previousWeekRange.inicio,
    data_fim_anterior: previousWeekRange.fim
  });
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

  // Função para mesclar dados duplicados (ex: Hyago aparece como email e como nome)
  const mergeSDRData = (dataArray: SDRProdutividadeData[]): SDRProdutividadeData[] => {
    const merged = new Map<string, SDRProdutividadeData>();
    
    dataArray.forEach(sdr => {
      const isHyagoEmail = sdr.sdr.toLowerCase().includes('hyago.alves');
      const isHyagoName = sdr.sdr.toLowerCase() === 'hyago';
      const key = isHyagoEmail || isHyagoName ? 'hyago.alves@liberdademedicaedu.com.br' : sdr.sdr;
      
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        merged.set(key, {
          sdr: key,
          ligacoes: existing.ligacoes + sdr.ligacoes,
          tempo_segundos: existing.tempo_segundos + sdr.tempo_segundos,
          whatsapp: existing.whatsapp + sdr.whatsapp,
          reunioes_marcadas: existing.reunioes_marcadas + sdr.reunioes_marcadas,
          reunioes_realizadas: existing.reunioes_realizadas + sdr.reunioes_realizadas
        });
      } else {
        merged.set(key, { ...sdr, sdr: key });
      }
    });
    
    return Array.from(merged.values());
  };

  // Filtrar Murilo e mesclar dados duplicados
  const sdrData = mergeSDRData(
    (data?.semana_atual || []).filter(sdr => !sdr.sdr.toLowerCase().includes('murilo'))
  );
  
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
                      <span className={colorM === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                        {ligReuniaoM.toFixed(2)}
                      </span>
                      <span className="ml-1">{colorM === 'green' ? '✅' : '❌'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={colorR === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                        {ligReuniaoR.toFixed(2)}
                      </span>
                      <span className="ml-1">{colorR === 'green' ? '✅' : '❌'}</span>
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
                  <span className={getIndicatorColor('ligacoes_reuniao_m', totalLigReuniaoM) === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {totalLigReuniaoM.toFixed(2)}
                  </span>
                  <span className="ml-1">{getIndicatorColor('ligacoes_reuniao_m', totalLigReuniaoM) === 'green' ? '✅' : '❌'}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={getIndicatorColor('ligacoes_reuniao_r', totalLigReuniaoR) === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {totalLigReuniaoR.toFixed(2)}
                  </span>
                  <span className="ml-1">{getIndicatorColor('ligacoes_reuniao_r', totalLigReuniaoR) === 'green' ? '✅' : '❌'}</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
