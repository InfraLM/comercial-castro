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
  const { getSdrName } = useUserMapping();
  
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data"],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/external-db-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT sdr, closer, situacao, dia_reuniao FROM reunioes_comercial',
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

    // Filtro de SDR
    if (filterSdr && filterSdr !== "all" && m.sdr !== filterSdr) {
      return false;
    }

    // Filtro de Closer
    if (filterCloser && filterCloser !== "all" && m.closer !== filterCloser) {
      return false;
    }

    return true;
  });

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
