import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, CalendarIcon, Users, Target, Zap, Phone, MessageCircle, Clock, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AdminClintRegistration() {
  const [date, setDate] = useState<Date>(new Date());
  const [leadsRecebidos, setLeadsRecebidos] = useState("");
  const [prospeccao, setProspeccao] = useState("");
  const [conexao, setConexao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sdrMapping } = useUserMapping();

  const [sdrData, setSdrData] = useState<Record<string, { ligacoes: string; whatsapp: string; tempo: string }>>({});

  const handleSaveRegistro = async () => {
    setIsLoading(true);

    try {
      const diaRegistro = format(date, "dd/MM/yyyy");

      // Always send values, defaulting to 0 when empty
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

      // Insert SDR data for all SDRs, defaulting to 0 when empty
      const sdrEmails = Object.keys(sdrMapping);
      const sdrInsertPromises = sdrEmails.map(async (email) => {
        const data = sdrData[email] || { ligacoes: "", whatsapp: "", tempo: "" };
        const sdrRecord = {
          dia_registro: diaRegistro,
          sdr: email,
          ligacoes: data.ligacoes ? parseInt(data.ligacoes) : 0,
          whatsap: data.whatsapp ? parseInt(data.whatsapp) : 0,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            Registro Clint
          </h2>
          <p className="text-muted-foreground">Registre os dados de performance diária da equipe SDR</p>
        </div>
        <Button 
          onClick={handleSaveRegistro} 
          disabled={isLoading}
          size="lg"
          className="shadow-lg"
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

      {/* Date Selection Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Data do Registro
          </CardTitle>
          <CardDescription>Selecione a data para o registro dos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal h-11",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Daily Metrics Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Métricas Diárias
          </CardTitle>
          <CardDescription>Informe os totais do dia (deixe em branco para registrar como 0)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="leads" className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                Leads Recebidos
              </Label>
              <Input
                id="leads"
                type="number"
                value={leadsRecebidos}
                onChange={(e) => setLeadsRecebidos(e.target.value)}
                placeholder="0"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospeccao" className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-amber-500" />
                </div>
                Prospecção
              </Label>
              <Input
                id="prospeccao"
                type="number"
                value={prospeccao}
                onChange={(e) => setProspeccao(e.target.value)}
                placeholder="0"
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conexao" className="text-sm font-medium flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                Conexão
              </Label>
              <Input
                id="conexao"
                type="number"
                value={conexao}
                onChange={(e) => setConexao(e.target.value)}
                placeholder="0"
                className="h-11 text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDR Performance Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Desempenho por SDR
          </CardTitle>
          <CardDescription>
            Registre as métricas individuais de cada SDR (campos vazios serão salvos como 0)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sdrEmails.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum SDR cadastrado.</p>
              <p className="text-sm">Adicione SDRs na seção de Usuários.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-foreground w-[200px]">SDR</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Ligações
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      <div className="flex items-center justify-center gap-2">
                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                        WhatsApp
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
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
                        "transition-colors",
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      <TableCell className="font-medium py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {(sdrMapping[email] || email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{sdrMapping[email] || email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            value={sdrData[email]?.ligacoes || ""}
                            onChange={(e) => handleSdrDataChange(email, "ligacoes", e.target.value)}
                            placeholder="0"
                            className="w-24 h-10 text-center"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            value={sdrData[email]?.whatsapp || ""}
                            onChange={(e) => handleSdrDataChange(email, "whatsapp", e.target.value)}
                            placeholder="0"
                            className="w-24 h-10 text-center"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center">
                          <Input
                            type="time"
                            step="1"
                            value={sdrData[email]?.tempo || ""}
                            onChange={(e) => handleSdrDataChange(email, "tempo", e.target.value)}
                            className="w-32 h-10 text-center"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
