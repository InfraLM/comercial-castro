import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, MessageCircle, Clock, Users } from "lucide-react";

interface SDRData {
  ligacoes: string;
  whatsapp: string;
  tempo: string;
}

interface SDRInputTableProps {
  sdrMapping: Record<string, string>;
  sdrData: Record<string, SDRData>;
  onSdrDataChange: (email: string, field: string, value: string) => void;
}

export function SDRInputTable({ sdrMapping, sdrData, onSdrDataChange }: SDRInputTableProps) {
  const sdrEmails = Object.keys(sdrMapping);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Desempenho por SDR
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-y border-border/50">
                <TableHead className="font-semibold text-foreground">SDR</TableHead>
                <TableHead className="font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Ligações
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    WhatsApp
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    Tempo
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrEmails.map((email, index) => (
                <TableRow 
                  key={email} 
                  className={cn(
                    "border-border/30 transition-colors hover:bg-muted/50",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                >
                  <TableCell className="font-medium py-2">
                    <span className="text-sm">{sdrMapping[email] || email}</span>
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      value={sdrData[email]?.ligacoes || ""}
                      onChange={(e) => onSdrDataChange(email, "ligacoes", e.target.value)}
                      placeholder="0"
                      className="w-20 h-8 text-sm text-center"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="number"
                      value={sdrData[email]?.whatsapp || ""}
                      onChange={(e) => onSdrDataChange(email, "whatsapp", e.target.value)}
                      placeholder="0"
                      className="w-20 h-8 text-sm text-center"
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <Input
                      type="time"
                      step="1"
                      value={sdrData[email]?.tempo || ""}
                      onChange={(e) => onSdrDataChange(email, "tempo", e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
