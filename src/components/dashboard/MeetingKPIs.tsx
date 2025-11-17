import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { parse, isWithinInterval } from "date-fns";
import { useUserMapping } from "@/contexts/UserMappingContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  closer: string;
  situacao: string;
  dia_reuniao: string;
}

interface MeetingKPIsProps {
  filterDateFrom?: Date;
  filterDateTo?: Date;
  filterSdr?: string;
  filterCloser?: string;
}

export const MeetingKPIs = ({ filterDateFrom, filterDateTo, filterSdr, filterCloser }: MeetingKPIsProps) => {
  const { getSdrName, getCloserName } = useUserMapping();
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-data-kpis"],
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
    if (filterSdr && filterSdr !== "all" && !(m.sdr === filterSdr || getSdrName(m.sdr) === filterSdr)) {
      return false;
    }

    // Filtro de Closer
    if (filterCloser && filterCloser !== "all" && !(m.closer === filterCloser || getCloserName(m.closer) === getCloserName(filterCloser))) {
      return false;
    }

    return true;
  });

  if (isLoading || !filteredMeetings) {
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

  const totalMeetings = filteredMeetings.length;
  const showCount = filteredMeetings.filter(m => 
    m.situacao && m.situacao.toLowerCase().trim() === "show"
  ).length;
  const noShowCount = filteredMeetings.filter(m => 
    m.situacao && m.situacao.toLowerCase().trim() === "no show"
  ).length;
  const showRate = totalMeetings > 0 ? ((showCount / totalMeetings) * 100).toFixed(1) : "0";
  const noShowRate = totalMeetings > 0 ? ((noShowCount / totalMeetings) * 100).toFixed(1) : "0";
  
  const uniqueSDRs = new Set(filteredMeetings.map(m => m.sdr)).size;

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
            {showRate}% do total
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
            {noShowRate}% do total
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
