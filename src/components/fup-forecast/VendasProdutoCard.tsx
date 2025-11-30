import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendasProduto } from "@/hooks/useFupForecast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface VendasProdutoCardProps {
  data_inicio: string;
  data_fim: string;
  currentWeek: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8', '#82ca9d', '#ffc658'];

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

  const produtos = data || [];
  
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

  const chartData = produtos.map(p => ({
    name: p.produto?.length > 20 ? p.produto.substring(0, 20) + '...' : p.produto,
    value: p.total
  }));

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
          
          {/* Gráfico de pizza */}
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhuma venda registrada no período
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
