import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useUserMapping } from "@/contexts/UserMappingContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  situacao: string;
}

export const SDRPerformanceChart = () => {
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
          query: 'SELECT sdr, situacao FROM reunioes_comercial',
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
          <CardTitle>Performance por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const sdrStats: Record<string, { Show: number; "No Show": number; total: number }> = {};

  meetings.forEach((meeting) => {
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
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
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
