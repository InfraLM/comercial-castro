import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversaoSDR } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { cn } from "@/lib/utils";

interface TaxaConversaoSDRTableProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

export function TaxaConversaoSDRTable({ data_inicio, data_fim, currentWeek }: TaxaConversaoSDRTableProps) {
  const { data, isLoading } = useConversaoSDR(data_inicio, data_fim);
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

  const sdrData = (data || []).sort((a, b) => {
    const taxaA = a.reunioes_realizadas === 0 ? 0 : (a.vendas / a.reunioes_realizadas) * 100;
    const taxaB = b.reunioes_realizadas === 0 ? 0 : (b.vendas / b.reunioes_realizadas) * 100;
    return taxaB - taxaA;
  });
  
  // Calcular totais
  const totais = sdrData.reduce(
    (acc, sdr) => ({
      reunioes_realizadas: acc.reunioes_realizadas + sdr.reunioes_realizadas,
      vendas: acc.vendas + sdr.vendas
    }),
    { reunioes_realizadas: 0, vendas: 0 }
  );

  const calcTaxaConversao = (vendas: number, realizadas: number) => {
    if (realizadas === 0) return 0;
    return (vendas / realizadas) * 100;
  };

  const totalTaxaConversao = calcTaxaConversao(totais.vendas, totais.reunioes_realizadas);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão SDR - W{currentWeek}</CardTitle>
        <CardDescription>
          Meta: &gt;25% de conversão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">SDR</TableHead>
                <TableHead className="text-center">Reuniões Realizadas</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-center">Taxa de Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrData.map((sdr) => {
                const taxaConversao = calcTaxaConversao(sdr.vendas, sdr.reunioes_realizadas);
                const color = getIndicatorColor('taxa_conversao', taxaConversao);
                
                return (
                  <TableRow key={sdr.sdr}>
                    <TableCell className="font-medium">{getSdrName(sdr.sdr)}</TableCell>
                    <TableCell className="text-center">{sdr.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">{sdr.vendas}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "font-medium",
                        color === 'green' 
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                      )}>
                        {taxaConversao.toFixed(2)}% {color === 'green' ? '✅' : '❌'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de totais */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL SDRs</TableCell>
                <TableCell className="text-center">{totais.reunioes_realizadas}</TableCell>
                <TableCell className="text-center">{totais.vendas}</TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "font-medium",
                    getIndicatorColor('taxa_conversao', totalTaxaConversao) === 'green' 
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20"
                  )}>
                    {totalTaxaConversao.toFixed(2)}% {getIndicatorColor('taxa_conversao', totalTaxaConversao) === 'green' ? '✅' : '❌'}
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
