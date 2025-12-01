import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendasProduto } from "@/hooks/useFupForecast";

interface VendasProdutoCardProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

export function VendasProdutoCard({ data_inicio, data_fim, currentWeek }: VendasProdutoCardProps) {
  const { data, isLoading } = useVendasProduto(data_inicio, data_fim);

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

  const produtos = data?.produtos || [];
  const financiamento = data?.financiamento || { com_financiamento: 0, sem_financiamento: 0 };
  
  // Calcular totais de pós-graduação
  const posGraduacaoProdutos = produtos.filter(p => 
    p.produto?.toLowerCase().includes('pos grad') || 
    p.produto?.toLowerCase().includes('pós grad') ||
    p.produto?.toLowerCase().includes('pós-grad')
  );
  
  const totalPosGraduacao = posGraduacaoProdutos.reduce((sum, p) => sum + p.total, 0);
  const totalPosGraduacaoSDR = posGraduacaoProdutos.reduce((sum, p) => sum + p.vendas_sdr, 0);
  const totalPosGraduacaoCloser = posGraduacaoProdutos.reduce((sum, p) => sum + p.vendas_closer, 0);
  
  const outrosProdutos = produtos.filter(p => 
    !p.produto?.toLowerCase().includes('pos grad') && 
    !p.produto?.toLowerCase().includes('pós grad') &&
    !p.produto?.toLowerCase().includes('pós-grad')
  );

  const totalGeral = produtos.reduce((sum, p) => sum + p.total, 0);
  const totalFinanciamento = financiamento.com_financiamento + financiamento.sem_financiamento;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Produto - W{currentWeek}</CardTitle>
        <CardDescription>
          Breakdown de vendas por produto vendido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabela de produtos */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Produto</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalPosGraduacao > 0 && (
                  <>
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-bold">TOTAL DE PÓS-GRADUAÇÃO</TableCell>
                      <TableCell className="text-center font-bold">{totalPosGraduacao}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-muted-foreground">↳ PÓS-GRADUAÇÃO SDR+CLOSERS</TableCell>
                      <TableCell className="text-center">{totalPosGraduacaoSDR}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="pl-8 text-muted-foreground">↳ PÓS-GRADUAÇÃO CLOSERS</TableCell>
                      <TableCell className="text-center">{totalPosGraduacaoCloser}</TableCell>
                    </TableRow>
                  </>
                )}
                
                {outrosProdutos.map((produto) => (
                  <TableRow key={produto.produto}>
                    <TableCell className="font-medium">{produto.produto}</TableCell>
                    <TableCell className="text-center">{produto.total}</TableCell>
                  </TableRow>
                ))}
                
                {/* Linha de total geral */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL GERAL</TableCell>
                  <TableCell className="text-center">{totalGeral}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {/* Tabela de Financiamento */}
          <div className="overflow-x-auto">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Financiamento - Pós-Graduação</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Tipo de Pagamento</TableHead>
                  <TableHead className="text-center">Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Com Financiamento</TableCell>
                  <TableCell className="text-center">{financiamento.com_financiamento}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sem Financiamento</TableCell>
                  <TableCell className="text-center">{financiamento.sem_financiamento}</TableCell>
                </TableRow>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOTAL PÓS-GRADUAÇÃO</TableCell>
                  <TableCell className="text-center">{totalFinanciamento}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
