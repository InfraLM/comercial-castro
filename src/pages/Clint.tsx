import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Clint() {
  const [date, setDate] = useState<Date>(new Date());
  const [leadsRecebidos, setLeadsRecebidos] = useState("");
  const [prospeccao, setProspeccao] = useState("");
  const [conexao, setConexao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sdrMapping } = useUserMapping();

  const [sdrData, setSdrData] = useState<Record<string, { ligacoes: string; whatsapp: string; tempo: string }>>({});

  const handleSaveRegistro = async () => {
    if (!leadsRecebidos && !prospeccao && !conexao) {
      toast.error("Preencha pelo menos um campo do registro diário");
      return;
    }

    setIsLoading(true);

    try {
      const diaRegistro = format(date, "yyyy-MM-dd");

      // Insert into clint_basemae
      const basemaeData = {
        dia_registro: diaRegistro,
        leads_recebidos: leadsRecebidos ? parseInt(leadsRecebidos) : 0,
        prospeccao: prospeccao ? parseInt(prospeccao) : 0,
        conexao: conexao ? parseInt(conexao) : 0,
      };

      const { error: basemaeError } = await supabase.functions.invoke('insert-data', {
        body: {
          tableName: 'clint_basemae',
          data: basemaeData,
        },
      });

      if (basemaeError) {
        throw new Error(`Erro ao salvar registro diário: ${basemaeError.message}`);
      }

      // Insert SDR data for each SDR that has data filled
      const sdrEmails = Object.keys(sdrMapping);
      const sdrInsertPromises = sdrEmails
        .filter(email => {
          const data = sdrData[email];
          return data && (data.ligacoes || data.whatsapp || data.tempo);
        })
        .map(async (email) => {
          const data = sdrData[email];
          const sdrRecord = {
            dia_registro: diaRegistro,
            sdr: email,
            ligacoes: data.ligacoes ? parseInt(data.ligacoes) : 0,
            whatsapp: data.whatsapp ? parseInt(data.whatsapp) : 0,
            tempo: data.tempo || "00:00:00",
          };

          return supabase.functions.invoke('insert-data', {
            body: {
              tableName: 'clint_sdr',
              data: sdrRecord,
            },
          });
        });

      const results = await Promise.all(sdrInsertPromises);
      const sdrErrors = results.filter(r => r.error);

      if (sdrErrors.length > 0) {
        console.error('SDR insert errors:', sdrErrors);
        toast.warning(`Registro salvo, mas ${sdrErrors.length} SDR(s) não foram salvos`);
      } else {
        toast.success("Registro salvo com sucesso!");
      }

      // Clear form
      setLeadsRecebidos("");
      setProspeccao("");
      setConexao("");
      setSdrData({});

    } catch (error) {
      console.error('Error saving registro:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar registro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSdrDataChange = (email: string, field: string, value: string) => {
    setSdrData(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        [field]: value
      }
    }));
  };

  const sdrEmails = Object.keys(sdrMapping);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Clint</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro Diário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Dia de Registro</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leads">Leads Recebidos</Label>
              <Input
                id="leads"
                type="number"
                value={leadsRecebidos}
                onChange={(e) => setLeadsRecebidos(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospeccao">Prospecção</Label>
              <Input
                id="prospeccao"
                type="number"
                value={prospeccao}
                onChange={(e) => setProspeccao(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conexao">Conexão</Label>
              <Input
                id="conexao"
                type="number"
                value={conexao}
                onChange={(e) => setConexao(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho por SDR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SDR</TableHead>
                  <TableHead>Ligações</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Tempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sdrEmails.map((email) => (
                  <TableRow key={email}>
                    <TableCell className="font-medium">
                      {sdrMapping[email] || email}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={sdrData[email]?.ligacoes || ""}
                        onChange={(e) => handleSdrDataChange(email, "ligacoes", e.target.value)}
                        placeholder="0"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={sdrData[email]?.whatsapp || ""}
                        onChange={(e) => handleSdrDataChange(email, "whatsapp", e.target.value)}
                        placeholder="0"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        step="1"
                        value={sdrData[email]?.tempo || ""}
                        onChange={(e) => handleSdrDataChange(email, "tempo", e.target.value)}
                        placeholder="00:00:00"
                        className="w-32"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveRegistro} 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Registro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
