import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Loader2, Users, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyRegistrationFormProps {
  date: Date;
  onDateChange: (date: Date) => void;
  leadsRecebidos: string;
  onLeadsChange: (value: string) => void;
  prospeccao: string;
  onProspeccaoChange: (value: string) => void;
  conexao: string;
  onConexaoChange: (value: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function DailyRegistrationForm({
  date,
  onDateChange,
  leadsRecebidos,
  onLeadsChange,
  prospeccao,
  onProspeccaoChange,
  conexao,
  onConexaoChange,
  onSave,
  isLoading,
}: DailyRegistrationFormProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Registro Diário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && onDateChange(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Leads
            </Label>
            <Input
              type="number"
              value={leadsRecebidos}
              onChange={(e) => onLeadsChange(e.target.value)}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Prospecção
            </Label>
            <Input
              type="number"
              value={prospeccao}
              onChange={(e) => onProspeccaoChange(e.target.value)}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Conexão
            </Label>
            <Input
              type="number"
              value={conexao}
              onChange={(e) => onConexaoChange(e.target.value)}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
