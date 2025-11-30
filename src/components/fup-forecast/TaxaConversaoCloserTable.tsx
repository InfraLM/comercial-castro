import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversaoCloser } from "@/hooks/useFupForecast";
import { getIndicatorColor } from "@/lib/dateUtils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { cn } from "@/lib/utils";

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

  const closerData = (data || []).sort((a, b) => {
    const taxaA = a.reunioes_realizadas === 0 ? 0 : (a.vendas / a.reunioes_realizadas) * 100;
    const taxaB = b.reunioes_realizadas === 0 ? 0 : (b.vendas / b.reunioes_realizadas) * 100;
    return taxaB - taxaA;
  });
  
  // Calcular totais
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
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão Closer - W{currentWeek}</CardTitle>
        <CardDescription>
          Meta: &gt;25% de conversão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Closer</TableHead>
                <TableHead className="text-center">Reuniões Realizadas</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-center">Taxa de Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closerData.map((closer) => {
                const taxaConversao = calcTaxaConversao(closer.vendas, closer.reunioes_realizadas);
                const color = getIndicatorColor('taxa_conversao', taxaConversao);
                
                return (
                  <TableRow key={closer.closer}>
                    <TableCell className="font-medium">{getCloserName(closer.closer)}</TableCell>
                    <TableCell className="text-center">{closer.reunioes_realizadas}</TableCell>
                    <TableCell className="text-center">{closer.vendas}</TableCell>
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
                <TableCell>TOTAL</TableCell>
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
