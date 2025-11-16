import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  tipo_reuniao: string;
}

const COLORS = ['hsl(142.1 76.2% 36.3%)', 'hsl(221.2 83.2% 53.3%)', 'hsl(47.9 95.8% 53.1%)', 'hsl(280.9 70% 50.8%)'];

export const MeetingTypeChart = () => {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data"],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/external-db-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT tipo_reuniao FROM reunioes_comercial',
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Falha ao buscar dados');
      }

      return result.data as MeetingData[];
    },
    refetchInterval: 30000,
  });

  if (isLoading || !meetings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const typeCounts: Record<string, number> = {};
  meetings.forEach((meeting) => {
    if (meeting.tipo_reuniao) {
      const tipo = meeting.tipo_reuniao.trim();
      typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
    }
  });

  const chartData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Tipo de Reunião</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
