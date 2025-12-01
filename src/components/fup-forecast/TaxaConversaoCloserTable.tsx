import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversaoCloser } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface TaxaConversaoCloserTableProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

export function TaxaConversaoCloserTable({ data_inicio, data_fim, currentWeek }: TaxaConversaoCloserTableProps) {
  const { data, isLoading } = useConversaoCloser(data_inicio, data_fim);
  const { getCloserName } = useUserMapping();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Filtrar Murilo e ordenar por taxa de conversão
  const closerData = (data || [])
    .filter((closer) => !closer.closer?.toLowerCase().includes('murilo'))
    .sort((a, b) => {
      const taxaA = a.reunioes_realizadas === 0 ? 0 : (a.vendas / a.reunioes_realizadas) * 100;
      const taxaB = b.reunioes_realizadas === 0 ? 0 : (b.vendas / b.reunioes_realizadas) * 100;
      return taxaB - taxaA;
    });
  
  const totais = closerData.reduce(
    (acc, closer) => ({
      reunioes_realizadas: acc.reunioes_realizadas + closer.reunioes_realizadas,
      vendas: acc.vendas + closer.vendas
    }),
    { reunioes_realizadas: 0, vendas: 0 }
  );

  const calcTaxaConversao = (vendas: number, realizadas: number) => {
    if (realizadas === 0) return 0;
    return (vendas / realizadas) * 100;
  };

  const totalTaxaConversao = calcTaxaConversao(totais.vendas, totais.reunioes_realizadas);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Taxa de Conversão Closer - W{currentWeek}</CardTitle>
        <CardDescription className="text-xs">
          Meta: &gt;25% de conversão
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs py-2">Closer</TableHead>
              <TableHead className="text-xs py-2 text-center w-16">Reun.</TableHead>
              <TableHead className="text-xs py-2 text-center w-16">Vendas</TableHead>
              <TableHead className="text-xs py-2 text-center w-20">Taxa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closerData.map((closer) => {
              const taxaConversao = calcTaxaConversao(closer.vendas, closer.reunioes_realizadas);
              const color = getIndicatorColor('taxa_conversao', taxaConversao);
              
              return (
                <TableRow key={closer.closer}>
                  <TableCell className="text-xs py-1.5 font-medium">{getCloserName(closer.closer)}</TableCell>
                  <TableCell className="text-xs py-1.5 text-center">{closer.reunioes_realizadas}</TableCell>
                  <TableCell className="text-xs py-1.5 text-center">{closer.vendas}</TableCell>
                  <TableCell className="text-xs py-1.5 text-center">
                    <span className={color === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                      {taxaConversao.toFixed(1)}% {color === 'green' ? '✅' : '❌'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            
            <TableRow className="bg-muted/50 font-bold border-t-2">
              <TableCell className="text-xs py-1.5">TOTAL</TableCell>
              <TableCell className="text-xs py-1.5 text-center">{totais.reunioes_realizadas}</TableCell>
              <TableCell className="text-xs py-1.5 text-center">{totais.vendas}</TableCell>
              <TableCell className="text-xs py-1.5 text-center">
                <span className={getIndicatorColor('taxa_conversao', totalTaxaConversao) === 'green' ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                  {totalTaxaConversao.toFixed(1)}% {getIndicatorColor('taxa_conversao', totalTaxaConversao) === 'green' ? '✅' : '❌'}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
