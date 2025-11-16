import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, TrendingDown } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  closer: string;
  situacao: string;
  tipo_reuniao: string;
  dia_registro: string;
}

export const MeetingKPIs = () => {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data"],
    queryFn: async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/external-db-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'SELECT * FROM reunioes_comercial ORDER BY dia_registro DESC',
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Falha ao buscar dados');
      }

      return result.data as MeetingData[];
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading || !meetings) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalMeetings = meetings.length;
  const showCount = meetings.filter(m => 
    m.situacao && m.situacao.toLowerCase().trim() === "show"
  ).length;
  const noShowCount = meetings.filter(m => 
    m.situacao && m.situacao.toLowerCase().trim() === "no show"
  ).length;
  const showRate = totalMeetings > 0 ? ((showCount / totalMeetings) * 100).toFixed(1) : "0";
  
  const uniqueSDRs = new Set(meetings.map(m => m.sdr)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMeetings}</div>
          <p className="text-xs text-muted-foreground">
            registradas no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Número de SHOW</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{showCount}</div>
          <p className="text-xs text-muted-foreground">
            {showRate}% do total de reuniões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Número de NO SHOW</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{noShowCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalMeetings > 0 ? ((noShowCount / totalMeetings) * 100).toFixed(1) : "0"}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SDRs Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueSDRs}</div>
          <p className="text-xs text-muted-foreground">
            gerando reuniões
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
