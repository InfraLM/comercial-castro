import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProdutividadeSDR } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface LigacoesReunioesTableProps {
  weekRange: { inicio: string; fim: string };
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

// Para métricas de ligações/reunião, MENOR é MELHOR
const TrendIndicator = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 || current === previous) {
    return <Minus className="h-3 w-3 text-muted-foreground inline ml-1" />;
  }
  
  const percentChange = ((current - previous) / previous) * 100;
  const isImprovement = current < previous; // Menor é melhor para ligações/reunião
  
  return (
    <span className={`inline-flex items-center ml-1 text-xs ${isImprovement ? 'text-emerald-600' : 'text-red-600'}`}>
      {isImprovement ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUp className="h-3 w-3" />
      )}
      <span className="ml-0.5">{Math.abs(percentChange).toFixed(1)}%</span>
    </span>
  );
};

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

  const sdrData = data?.semana_atual || [];
  const sdrDataAnterior = data?.semana_anterior || [];
  
  // Criar mapa da semana anterior para comparação
  const anteriorMap = new Map<string, { ligacoes: number; reunioes_marcadas: number; reunioes_realizadas: number }>();
  sdrDataAnterior.forEach(sdr => {
    anteriorMap.set(sdr.sdr, {
      ligacoes: sdr.ligacoes,
      reunioes_marcadas: sdr.reunioes_marcadas,
      reunioes_realizadas: sdr.reunioes_realizadas
    });
  });
  
  // Calcular totais atual
  const totais = sdrData.reduce(
    (acc, sdr) => ({
      ligacoes: acc.ligacoes + sdr.ligacoes,
      reunioes_marcadas: acc.reunioes_marcadas + sdr.reunioes_marcadas,
      reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas
    }),
    { ligacoes: 0, reunioes_marcadas: 0, reunioes_realizadas: 0 }
  );
  
  // Calcular totais anterior
  const totaisAnterior = sdrDataAnterior.reduce(
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
  const totalLigReuniaoMAnterior = calcLigReuniaoM(totaisAnterior.ligacoes, totaisAnterior.reunioes_marcadas);
  const totalLigReuniaoRAnterior = calcLigReuniaoR(totaisAnterior.ligacoes, totaisAnterior.reunioes_realizadas);

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
                
                // Dados anteriores para comparação
                const anterior = anteriorMap.get(sdr.sdr);
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">
                      {sdr.ligacoes.toLocaleString('pt-BR')}
                      {anterior && <TrendIndicator current={sdr.ligacoes} previous={anterior.ligacoes} />}
                    </TableCell>
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
                <TableCell className="text-center">
                  {totais.ligacoes.toLocaleString('pt-BR')}
                  <TrendIndicator current={totais.ligacoes} previous={totaisAnterior.ligacoes} />
                </TableCell>
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
