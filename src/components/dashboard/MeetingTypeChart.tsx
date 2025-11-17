import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { parse, isWithinInterval } from "date-fns";
import { useUserMapping } from "@/contexts/UserMappingContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  tipo_reuniao: string;
  sdr: string;
  closer: string;
  dia_reuniao: string;
}

const COLORS = ['hsl(142.1 76.2% 36.3%)', 'hsl(221.2 83.2% 53.3%)', 'hsl(47.9 95.8% 53.1%)', 'hsl(280.9 70% 50.8%)'];

interface MeetingTypeChartProps {
  filterDateFrom?: Date;
  filterDateTo?: Date;
  filterSdr?: string;
  filterCloser?: string;
}

export const MeetingTypeChart = ({ filterDateFrom, filterDateTo, filterSdr, filterCloser }: MeetingTypeChartProps) => {
  const { getSdrName, getCloserName } = useUserMapping();
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data-type"],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/external-db-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT tipo_reuniao, sdr, closer, dia_reuniao FROM reunioes_comercial',
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

  const normalize = (s: string | undefined | null) => (s ? s.toLowerCase().trim() : "");
  const filteredMeetings = meetings?.filter((m) => {
    // Filtro de data
    if (filterDateFrom || filterDateTo) {
      try {
        const meetingDate = parse(m.dia_reuniao, 'dd/MM/yyyy', new Date());
        if (filterDateFrom && filterDateTo) {
          if (!isWithinInterval(meetingDate, { start: filterDateFrom, end: filterDateTo })) {
            return false;
          }
        } else if (filterDateFrom) {
          if (meetingDate < filterDateFrom) return false;
        } else if (filterDateTo) {
          if (meetingDate > filterDateTo) return false;
        }
      } catch (e) {
        return false;
      }
    }

    // Filtro de SDR (coluna sdr)
    if (filterSdr && filterSdr !== "all") {
      const mSdr = normalize(m.sdr);
      const sel = normalize(filterSdr);
      const mSdrName = normalize(getSdrName(m.sdr));
      const selName = normalize(getSdrName(filterSdr));
      if (!(mSdr === sel || mSdrName === sel || mSdrName === selName)) {
        return false;
      }
    }

    // Filtro de Closer (coluna closer)
    if (filterCloser && filterCloser !== "all") {
      const mCloser = normalize(m.closer);
      const sel = normalize(filterCloser);
      const mCloserName = normalize(getCloserName(m.closer));
      const selName = normalize(getCloserName(filterCloser));
      if (!(mCloser === sel || mCloserName === sel || mCloserName === selName)) {
        return false;
      }
    }

    return true;
  });

  if (isLoading || !filteredMeetings) {
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
  filteredMeetings.forEach((meeting) => {
    if (meeting.tipo_reuniao) {
      const tipo = meeting.tipo_reuniao.trim();
      typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
    }
  });

  const totalMeetings = filteredMeetings.length;
  
  if (totalMeetings === 0 || Object.keys(typeCounts).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Reunião</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para os filtros selecionados
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / totalMeetings) * 100).toFixed(1),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Tipo de Reunião</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="40%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="white" 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    className="text-sm font-semibold"
                  >
                    {value}
                  </text>
                );
              }}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${value} reuniões (${props.payload.percentage}%)`,
                name
              ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend 
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: string, entry: any) => {
                const payload = entry.payload;
                return `${value}: ${payload.value} (${payload.percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
