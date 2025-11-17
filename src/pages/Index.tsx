import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useMeetingsConfig } from "@/contexts/MeetingsConfigContext";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { MeetingKPIs } from "@/components/dashboard/MeetingKPIs";
import { SDRPerformanceChart } from "@/components/dashboard/SDRPerformanceChart";
import { SDRPerformanceTable } from "@/components/dashboard/SDRPerformanceTable";
import { MeetingTypeChart } from "@/components/dashboard/MeetingTypeChart";
import { Badge } from "@/components/ui/badge";
import type { DateRange } from "react-day-picker";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { config } = useMeetingsConfig();
  const { getSdrName, getCloserName } = useUserMapping();
  const [open, setOpen] = useState(false);
  const [sdr, setSdr] = useState<string>("");
  const [closer, setCloser] = useState<string>("");
  const [tipoReuniao, setTipoReuniao] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [diaReuniao, setDiaReuniao] = useState<Date | undefined>(undefined);
  const [situacao, setSituacao] = useState<string>("");
  
  // Estados para os filtros
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [filterSdr, setFilterSdr] = useState<string>("");
  const [filterCloser, setFilterCloser] = useState<string>("");

  const insertMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/insert-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName: 'reunioes_comercial',
          data,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha ao inserir dados');
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("Reunião registrada com sucesso!");
      setOpen(false);
      setSdr("");
      setCloser("");
      setTipoReuniao("");
      setNome("");
      setEmail("");
      setDiaReuniao(undefined);
      setSituacao("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar reunião: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valida apenas campos habilitados
    const requiredFieldsValid = 
      (!config.formFields.sdr || sdr) &&
      (!config.formFields.closer || closer) &&
      (!config.formFields.tipoReuniao || tipoReuniao) &&
      (!config.formFields.nome || nome) &&
      (!config.formFields.email || email) &&
      (!config.formFields.diaReuniao || diaReuniao) &&
      (!config.formFields.situacao || situacao);

    if (!requiredFieldsValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const now = new Date();
    const dia_registro_formatted = format(now, 'dd/MM/yyyy');
    const hora_registro_formatted = format(now, 'HH:mm:ss');
    const dia_reuniao_formatted = diaReuniao ? format(diaReuniao, 'dd/MM/yyyy') : '';
    
    const id_reunioes = `${dia_registro_formatted}|${hora_registro_formatted}|${sdr}|${closer}|${nome}|${dia_reuniao_formatted}|${tipoReuniao}|${situacao}`;
    
    const data = {
      id_reunioes,
      dia_registro: dia_registro_formatted,
      hora_registro: hora_registro_formatted,
      sdr,
      closer,
      nome,
      dia_reuniao: dia_reuniao_formatted,
      situacao,
      tipo_reuniao: tipoReuniao,
      email,
    };

    insertMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Reuniões</h1>
            <p className="text-muted-foreground">Gerencie as reuniões comerciais</p>
          </div>
          <NavLink to="/admin">
            <Button variant="outline">Administrador</Button>
          </NavLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Registro de Reuniões</span>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Reunião
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Reunião</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {config.formFields.sdr && (
                        <div className="space-y-2">
                          <Label htmlFor="sdr">SDR *</Label>
                          <Select value={sdr} onValueChange={setSdr}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o SDR" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.sdrOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config.formFields.closer && (
                        <div className="space-y-2">
                          <Label htmlFor="closer">Closer *</Label>
                          <Select value={closer} onValueChange={setCloser}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o Closer" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.closersOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config.formFields.tipoReuniao && (
                        <div className="space-y-2">
                          <Label htmlFor="tipo_reuniao">Tipo Reunião *</Label>
                          <Select value={tipoReuniao} onValueChange={setTipoReuniao}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.tipoReuniaoOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config.formFields.situacao && (
                        <div className="space-y-2">
                          <Label htmlFor="situacao">Situação *</Label>
                          <Select value={situacao} onValueChange={setSituacao}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a situação" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.situacaoOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {config.formFields.nome && (
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome *</Label>
                          <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Digite o nome"
                          />
                        </div>
                      )}

                      {config.formFields.email && (
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                      )}

                      {config.formFields.diaReuniao && (
                        <div className="space-y-2 col-span-2">
                          <Label>Data da Reunião *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !diaReuniao && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {diaReuniao ? format(diaReuniao, "PPP") : <span>Selecione uma data</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={diaReuniao}
                                onSelect={setDiaReuniao}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={insertMutation.isPending}>
                        {insertMutation.isPending ? "Registrando..." : "Registrar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8 mb-6">
              Clique em "Registrar Reunião" para adicionar uma nova reunião
            </p>
            
            {/* Filtros */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de Período */}
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filterDateRange?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDateRange?.from ? (
                          filterDateRange.to ? (
                            <span>
                              {format(filterDateRange.from, "dd/MM/yyyy")} - {format(filterDateRange.to, "dd/MM/yyyy")}
                            </span>
                          ) : (
                            format(filterDateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>Selecione o período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={filterDateRange}
                        onSelect={setFilterDateRange}
                        initialFocus
                        className="pointer-events-auto"
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Filtro de SDR */}
                <div className="space-y-2">
                  <Label>SDR</Label>
                  <Select value={filterSdr} onValueChange={setFilterSdr}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os SDRs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os SDRs</SelectItem>
                      {config.sdrOptions.map((sdrEmail) => (
                        <SelectItem key={sdrEmail} value={sdrEmail}>
                          {getSdrName(sdrEmail)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Closer */}
                <div className="space-y-2">
                  <Label>Closer</Label>
                  <Select value={filterCloser} onValueChange={setFilterCloser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Closers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Closers</SelectItem>
                      {config.closersOptions.map((closerEmail) => (
                        <SelectItem key={closerEmail} value={closerEmail}>
                          {getCloserName(closerEmail)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Badges de filtros ativos */}
              {(filterDateRange?.from || (filterSdr && filterSdr !== "all") || (filterCloser && filterCloser !== "all")) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filterDateRange?.from && (
                    <Badge variant="secondary" className="gap-1">
                      Período: {format(filterDateRange.from, "dd/MM/yyyy")}
                      {filterDateRange.to && ` - ${format(filterDateRange.to, "dd/MM/yyyy")}`}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFilterDateRange(undefined)}
                      />
                    </Badge>
                  )}
                  {filterSdr && filterSdr !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      SDR: {getSdrName(filterSdr)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFilterSdr("")}
                      />
                    </Badge>
                  )}
                  {filterCloser && filterCloser !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Closer: {getCloserName(filterCloser)}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setFilterCloser("")}
                      />
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFilterDateRange(undefined);
                      setFilterSdr("");
                      setFilterCloser("");
                    }}
                  >
                    Limpar todos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard e KPIs */}
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          
          {/* KPIs Cards */}
          <MeetingKPIs 
            filterDateFrom={filterDateRange?.from}
            filterDateTo={filterDateRange?.to}
            filterSdr={filterSdr}
            filterCloser={filterCloser}
          />

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <SDRPerformanceChart 
              filterDateFrom={filterDateRange?.from}
              filterDateTo={filterDateRange?.to}
              filterSdr={filterSdr}
              filterCloser={filterCloser}
            />
            <MeetingTypeChart 
              filterDateFrom={filterDateRange?.from}
              filterDateTo={filterDateRange?.to}
              filterSdr={filterSdr}
              filterCloser={filterCloser}
            />
          </div>

          {/* Tabela Detalhada */}
          <SDRPerformanceTable 
            filterDateFrom={filterDateRange?.from}
            filterDateTo={filterDateRange?.to}
            filterSdr={filterSdr}
            filterCloser={filterCloser}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
