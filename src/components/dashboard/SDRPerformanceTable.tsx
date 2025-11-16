import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserMapping } from "@/contexts/UserMappingContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface MeetingData {
  sdr: string;
  situacao: string;
}

export const SDRPerformanceTable = () => {
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
          <CardTitle>Desempenho Detalhado por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const sdrStats: Record<string, { show: number; noShow: number; total: number }> = {};

  meetings.forEach((meeting) => {
    const sdrName = getSdrName(meeting.sdr);
    if (!sdrStats[sdrName]) {
      sdrStats[sdrName] = { show: 0, noShow: 0, total: 0 };
    }
    sdrStats[sdrName].total++;
    
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
            {tableData.map((row) => (
              <TableRow key={row.sdr}>
                <TableCell className="font-medium">{row.sdr}</TableCell>
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
                    className={parseFloat(row.showRate) >= 70 ? "bg-green-600" : "bg-yellow-600"}
                  >
                    {row.showRate}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
