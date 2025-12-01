import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendasProduto } from "@/hooks/useFupForecast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface VendasProdutoCardProps {
  data_inicio: string;
  data_fim: string;
  previousWeekRange: { inicio: string; fim: string };
  currentWeek: number;
}

export function VendasProdutoCard({ data_inicio, data_fim, previousWeekRange, currentWeek }: VendasProdutoCardProps) {
  const { data, isLoading } = useVendasProduto(
    data_inicio, 
    data_fim, 
    previousWeekRange.inicio, 
    previousWeekRange.fim
  );

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
  const financiamentoAnterior = data?.financiamento_anterior || { com_financiamento: 0, sem_financiamento: 0 };
  
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

  // Dados para o gráfico de pizza
  const pieData = [
    { name: 'Com Financiamento', value: financiamento.com_financiamento },
    { name: 'Sem Financiamento', value: financiamento.sem_financiamento },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  // Função para calcular tendência
  const getTrendDisplay = (atual: number, anterior: number) => {
    if (anterior === 0) {
      if (atual > 0) {
        return { 
          percentage: 100, 
          isPositive: true, 
          icon: <TrendingUp className="h-4 w-4 text-green-500" /> 
        };
      }
      return null;
    }
    
    const diff = ((atual - anterior) / anterior) * 100;
    const isPositive = diff > 0;
    
    return {
      percentage: Math.abs(diff).toFixed(1),
      isPositive,
      icon: isPositive 
        ? <TrendingUp className="h-4 w-4 text-green-500" />
        : <TrendingDown className="h-4 w-4 text-red-500" />
    };
  };

  const trendComFinanciamento = getTrendDisplay(
    financiamento.com_financiamento, 
    financiamentoAnterior.com_financiamento
  );
  const trendSemFinanciamento = getTrendDisplay(
    financiamento.sem_financiamento, 
    financiamentoAnterior.sem_financiamento
  );

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
          
          {/* Seção de Financiamento */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Financiamento - Pós-Graduação</h4>
            
            {/* Gráfico de Pizza */}
            {totalFinanciamento > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="40%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="white" 
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="text-xs font-bold"
                          >
                            {value} ({(percent * 100).toFixed(0)}%)
                          </text>
                        );
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Vendas']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value: string, entry: any) => {
                        const payload = entry.payload;
                        const pct = ((payload.value / totalFinanciamento) * 100).toFixed(0);
                        return `${value}: ${payload.value} (${pct}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados de financiamento
              </div>
            )}

            {/* Tabela de Financiamento com Indicadores */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Tipo de Pagamento</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-center">Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Com Financiamento</TableCell>
                    <TableCell className="text-center">{financiamento.com_financiamento}</TableCell>
                    <TableCell className="text-center">
                      {trendComFinanciamento && (
                        <div className="flex items-center justify-center gap-1">
                          {trendComFinanciamento.icon}
                          <span className={trendComFinanciamento.isPositive ? 'text-green-500' : 'text-red-500'}>
                            {trendComFinanciamento.isPositive ? '+' : '-'}{trendComFinanciamento.percentage}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sem Financiamento</TableCell>
                    <TableCell className="text-center">{financiamento.sem_financiamento}</TableCell>
                    <TableCell className="text-center">
                      {trendSemFinanciamento && (
                        <div className="flex items-center justify-center gap-1">
                          {trendSemFinanciamento.icon}
                          <span className={trendSemFinanciamento.isPositive ? 'text-green-500' : 'text-red-500'}>
                            {trendSemFinanciamento.isPositive ? '+' : '-'}{trendSemFinanciamento.percentage}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL PÓS-GRADUAÇÃO</TableCell>
                    <TableCell className="text-center">{totalFinanciamento}</TableCell>
                    <TableCell className="text-center">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
