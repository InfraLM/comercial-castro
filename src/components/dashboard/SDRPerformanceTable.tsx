import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { parse, isWithinInterval } from "date-fns";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  closer: string;
  situacao: string;
  nome: string;
  dia_reuniao: string;
  tipo_reuniao: string;
}

interface SDRPerformanceTableProps {
  filterDateFrom?: Date;
  filterDateTo?: Date;
  filterSdr?: string;
  filterCloser?: string;
}

export const SDRPerformanceTable = ({ filterDateFrom, filterDateTo, filterSdr, filterCloser }: SDRPerformanceTableProps) => {
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
          query: 'SELECT sdr, closer, situacao, nome, dia_reuniao, tipo_reuniao FROM reunioes_comercial',
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
          <CardTitle>Desempenho Detalhado por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const sdrStats: Record<string, { show: number; noShow: number; total: number; meetings: MeetingData[] }> = {};

  filteredMeetings.forEach((meeting) => {
    const sdrName = getSdrName(meeting.sdr);
    if (!sdrStats[sdrName]) {
      sdrStats[sdrName] = { show: 0, noShow: 0, total: 0, meetings: [] };
    }
    sdrStats[sdrName].total++;
    sdrStats[sdrName].meetings.push(meeting);
    
    const situacao = meeting.situacao?.toLowerCase().trim();
    if (situacao === "show") {
      sdrStats[sdrName].show++;
    } else if (situacao === "no show") {
      sdrStats[sdrName].noShow++;
    }
  });

  const tableData = Object.entries(sdrStats)
    .map(([sdr, data]) => ({
      sdr,
      show: data.show,
      noShow: data.noShow,
      total: data.total,
      showRate: data.total > 0 ? ((data.show / data.total) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desempenho Detalhado por SDR</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SDR</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Show</TableHead>
              <TableHead className="text-center">No Show</TableHead>
              <TableHead className="text-center">Taxa de Show</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => {
              const sdrMeetings = sdrStats[row.sdr]?.meetings || [];
              
              return (
                <HoverCard key={row.sdr} openDelay={200}>
                  <HoverCardTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {row.sdr}
                      </TableCell>
                      <TableCell className="text-center">{row.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {row.show}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {row.noShow}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={parseFloat(row.showRate) >= 70 ? "default" : "secondary"}
                          className="font-semibold"
                        >
                          {row.showRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    className="w-[700px] max-w-[90vw]" 
                    side="top"
                    sideOffset={10}
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold mb-3">Reuniões de {row.sdr}</h4>
                      <div className="max-h-[400px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px]">Cliente</TableHead>
                              <TableHead className="min-w-[100px]">Data</TableHead>
                              <TableHead className="min-w-[120px]">Tipo</TableHead>
                              <TableHead className="min-w-[100px]">Situação</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sdrMeetings.map((meeting, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">{meeting.nome}</TableCell>
                                <TableCell className="text-xs whitespace-nowrap">{meeting.dia_reuniao}</TableCell>
                                <TableCell className="text-xs">{meeting.tipo_reuniao}</TableCell>
                                <TableCell className="text-xs">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      meeting.situacao?.toLowerCase().trim() === "show"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    }
                                  >
                                    {meeting.situacao}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
