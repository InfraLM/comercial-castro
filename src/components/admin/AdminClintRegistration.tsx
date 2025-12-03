import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Save, Loader2, CalendarIcon, BarChart3, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminClintRegistration() {
  const [date, setDate] = useState<Date>(new Date());
  const [txtSemFiltro, setTxtSemFiltro] = useState("");
  const [txtComFiltro, setTxtComFiltro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const isSubmitting = useRef(false);

  const checkForDuplicates = async (diaRegistro: string): Promise<boolean> => {
    try {
      const { data } = await supabase.functions.invoke('external-db-query', {
        body: {
          query: `SELECT COUNT(*) as count FROM clint_text WHERE dia_registro = $1`,
          params: [diaRegistro],
        },
      });

      return data?.data?.[0]?.count > 0;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const handleSaveRegistro = async (forceInsert = false) => {
    if (isSubmitting.current || isLoading) {
      console.log('Submission already in progress, ignoring...');
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);

    try {
      const diaRegistro = format(date, "dd/MM/yyyy");

      if (!forceInsert) {
        const hasDuplicate = await checkForDuplicates(diaRegistro);
        if (hasDuplicate) {
          setShowDuplicateAlert(true);
          setIsLoading(false);
          isSubmitting.current = false;
          return;
        }
      }

      const textData = {
        dia_registro: diaRegistro,
        txt: txtSemFiltro || "",
        txt_filtro: txtComFiltro || "",
      };

      console.log('Inserting text data:', textData);

      const { error } = await supabase.functions.invoke('insert-data', {
        body: {
          tableName: 'clint_text',
          data: textData,
        },
      });

      if (error) {
        throw new Error(`Erro ao salvar registro: ${error.message}`);
      }

      toast.success("Registro salvo com sucesso!");

      setTxtSemFiltro("");
      setTxtComFiltro("");

    } catch (error) {
      console.error('Error saving registro:', error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar registro");
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

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
          <p className="text-muted-foreground">Registre os textos para processamento</p>
        </div>
        <Button 
          onClick={() => handleSaveRegistro()} 
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

      {/* Text Registration Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Registro de Texto
          </CardTitle>
          <CardDescription>Adicione os textos para processamento na tabela clint_text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="txtSemFiltro" className="text-sm font-medium">
              Txt sem filtro
            </Label>
            <Textarea
              id="txtSemFiltro"
              value={txtSemFiltro}
              onChange={(e) => setTxtSemFiltro(e.target.value)}
              placeholder="Cole ou digite o texto sem filtro aqui..."
              className="min-h-[200px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="txtComFiltro" className="text-sm font-medium">
              Txt com filtro
            </Label>
            <Textarea
              id="txtComFiltro"
              value={txtComFiltro}
              onChange={(e) => setTxtComFiltro(e.target.value)}
              placeholder="Cole ou digite o texto com filtro aqui..."
              className="min-h-[200px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Alert Dialog */}
      <AlertDialog open={showDuplicateAlert} onOpenChange={setShowDuplicateAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Registro Duplicado Detectado
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Já existe um registro para a data <strong>{format(date, "dd/MM/yyyy")}</strong>.</p>
              <p className="pt-2">Deseja inserir um novo registro mesmo assim? Isso pode criar dados duplicados.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSaveRegistro(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Inserir Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
