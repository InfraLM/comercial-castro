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
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SDR_OPTIONS = ["Gustavo", "Murilo", "Weber", "Luanda", "Ana Beatriz", "Luiz Gustavo"];
const CLOSERS_OPTIONS = ["Ana Karolina", "Gustavo", "Marcelo", "Matheus", "Ricardo"];
const TIPO_REUNIAO_OPTIONS = ["Pós graduação", "IOT + VM"];
const SITUACAO_OPTIONS = ["Show", "No Show"];

const Index = () => {
  const [open, setOpen] = useState(false);
  const [sdr, setSdr] = useState<string>("");
  const [closer, setCloser] = useState<string>("");
  const [tipoReuniao, setTipoReuniao] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [diaReuniao, setDiaReuniao] = useState<Date | undefined>(undefined);
  const [situacao, setSituacao] = useState<string>("");

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
    
    if (!sdr || !closer || !tipoReuniao || !nome || !email || !diaReuniao || !situacao) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const now = new Date();
    const data = {
      dia_registro: format(now, 'yyyy-MM-dd'),
      hora_registro: format(now, 'HH:mm:ss'),
      sdr,
      closer,
      nome,
      dia_reunião: format(diaReuniao, 'yyyy-MM-dd'),
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
                      <div className="space-y-2">
                        <Label htmlFor="sdr">SDR *</Label>
                        <Select value={sdr} onValueChange={setSdr}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o SDR" />
                          </SelectTrigger>
                          <SelectContent>
                            {SDR_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="closer">Closer *</Label>
                        <Select value={closer} onValueChange={setCloser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o Closer" />
                          </SelectTrigger>
                          <SelectContent>
                            {CLOSERS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tipo_reuniao">Tipo Reunião *</Label>
                        <Select value={tipoReuniao} onValueChange={setTipoReuniao}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_REUNIAO_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="situacao">Situação *</Label>
                        <Select value={situacao} onValueChange={setSituacao}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                          <SelectContent>
                            {SITUACAO_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                          id="nome"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Digite o nome"
                        />
                      </div>

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
                              {diaReuniao ? format(diaReuniao, "dd/MM/yyyy") : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={diaReuniao}
                              onSelect={setDiaReuniao}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
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
            <p className="text-muted-foreground text-center py-8">
              Clique em "Registrar Reunião" para adicionar uma nova reunião
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
