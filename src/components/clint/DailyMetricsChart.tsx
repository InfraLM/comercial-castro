import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyMetric {
  dia_registro: string;
  leads_recebidos: number;
  prospeccao: number;
  conexao: number;
}

interface DailyMetricsChartProps {
  data: DailyMetric[];
  isLoading?: boolean;
}

export function DailyMetricsChart({ data, isLoading = false }: DailyMetricsChartProps) {
  const chartData = [...data]
    .reverse()
    .map((item) => {
      let formattedDate = item.dia_registro;
      try {
        const date = parseISO(item.dia_registro);
        formattedDate = format(date, "dd/MM", { locale: ptBR });
      } catch {
        // Keep original if parsing fails
      }
      
      return {
        date: formattedDate,
        leads: Number(item.leads_recebidos) || 0,
        prospeccao: Number(item.prospeccao) || 0,
        conexao: Number(item.conexao) || 0,
      };
    });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Métricas Diárias</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          Evolução Diária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="leads" 
              name="Leads" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="prospeccao" 
              name="Prospecção" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: "#f59e0b", strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="conexao" 
              name="Conexão" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
