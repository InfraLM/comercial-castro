import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { parse, isWithinInterval } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  closer: string;
  situacao: string;
  dia_reuniao: string;
}

interface SDRPerformanceChartProps {
  filterDateFrom?: Date;
  filterDateTo?: Date;
  filterSdr?: string;
  filterCloser?: string;
}

export const SDRPerformanceChart = ({ filterDateFrom, filterDateTo, filterSdr, filterCloser }: SDRPerformanceChartProps) => {
  const { getSdrName, getCloserName } = useUserMapping();
  
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data-chart", filterDateFrom?.toISOString(), filterDateTo?.toISOString(), filterSdr, filterCloser],
    queryFn: async () => {
      // Construir SQL dinâmico com filtros
      let query = 'SELECT sdr, closer, situacao, dia_reuniao FROM reunioes_comercial';
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Filtro de Closer
      if (filterCloser && filterCloser !== "all") {
        const closerName = getCloserName(filterCloser);
        whereClauses.push(`(LOWER(TRIM(closer)) = LOWER(TRIM($${paramIndex})) OR LOWER(TRIM(closer)) = LOWER(TRIM($${paramIndex + 1})))`);
        params.push(filterCloser, closerName);
        paramIndex += 2;
      }

      // Filtro de SDR
      if (filterSdr && filterSdr !== "all") {
        const sdrName = getSdrName(filterSdr);
        whereClauses.push(`(LOWER(TRIM(sdr)) = LOWER(TRIM($${paramIndex})) OR LOWER(TRIM(sdr)) = LOWER(TRIM($${paramIndex + 1})))`);
        params.push(filterSdr, sdrName);
        paramIndex += 2;
      }

      // Filtro de data
      if (filterDateFrom && filterDateTo) {
        const dateFrom = filterDateFrom.toISOString().split('T')[0];
        const dateTo = filterDateTo.toISOString().split('T')[0];
        whereClauses.push(`to_date(dia_reuniao, 'DD/MM/YYYY') BETWEEN $${paramIndex}::date AND $${paramIndex + 1}::date`);
        params.push(dateFrom, dateTo);
        paramIndex += 2;
      } else if (filterDateFrom) {
        const dateFrom = filterDateFrom.toISOString().split('T')[0];
        whereClauses.push(`to_date(dia_reuniao, 'DD/MM/YYYY') >= $${paramIndex}::date`);
        params.push(dateFrom);
        paramIndex += 1;
      } else if (filterDateTo) {
        const dateTo = filterDateTo.toISOString().split('T')[0];
        whereClauses.push(`to_date(dia_reuniao, 'DD/MM/YYYY') <= $${paramIndex}::date`);
        params.push(dateTo);
        paramIndex += 1;
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/external-db-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          params,
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

  const filteredMeetings = meetings;

  if (isLoading || !filteredMeetings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const sdrStats: Record<string, { Show: number; "No Show": number; total: number }> = {};

  filteredMeetings.forEach((meeting) => {
    const sdrName = getSdrName(meeting.sdr);
    if (!sdrStats[sdrName]) {
      sdrStats[sdrName] = { Show: 0, "No Show": 0, total: 0 };
    }
    sdrStats[sdrName].total++;
    
    const situacao = meeting.situacao?.toLowerCase().trim();
    if (situacao === "show") {
      sdrStats[sdrName].Show++;
    } else if (situacao === "no show") {
      sdrStats[sdrName]["No Show"]++;
    }
  });

  const chartData = Object.entries(sdrStats)
    .map(([name, data]) => ({
      name,
      Show: data.Show,
      "No Show": data["No Show"],
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por SDR</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              style={{ fontSize: '12px' }}
            />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar dataKey="Show" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="No Show" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
