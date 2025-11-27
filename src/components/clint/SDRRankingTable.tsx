import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface SDRData {
  sdr: string;
  total_ligacoes: number;
  total_whatsapp: number;
  dias_trabalhados: number;
}

interface SDRRankingTableProps {
  data: SDRData[];
  isLoading?: boolean;
}

export function SDRRankingTable({ data, isLoading = false }: SDRRankingTableProps) {
  const { sdrMapping } = useUserMapping();

  const sortedData = [...data].sort(
    (a, b) => (Number(b.total_ligacoes) + Number(b.total_whatsapp)) - (Number(a.total_ligacoes) + Number(a.total_whatsapp))
  );

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm text-muted-foreground font-medium">{index + 1}º</span>;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "default";
    if (index === 1) return "secondary";
    if (index === 2) return "outline";
    return "outline";
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Ranking de SDRs</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking de SDRs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>SDR</TableHead>
              <TableHead className="text-right">Ligações</TableHead>
              <TableHead className="text-right">WhatsApp</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Dias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => {
              const total = Number(item.total_ligacoes) + Number(item.total_whatsapp);
              return (
                <TableRow key={item.sdr} className="border-border/30 hover:bg-muted/50">
                  <TableCell>{getRankIcon(index)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant={getRankBadge(index)} className="text-xs">
                        {sdrMapping[item.sdr] || item.sdr?.split("@")[0] || "N/A"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {Number(item.total_ligacoes).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-500">
                    {Number(item.total_whatsapp).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {total.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {Number(item.dias_trabalhados)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
