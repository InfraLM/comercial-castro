import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyRegistrationForm } from "@/components/clint/DailyRegistrationForm";
import { SDRInputTable } from "@/components/clint/SDRInputTable";

export function AdminClintRegistration() {
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
      const diaRegistro = format(date, "dd/MM/yyyy");

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Registro Clint</h2>
          <p className="text-muted-foreground">Registre dados de performance SDR</p>
        </div>
        <Button 
          onClick={handleSaveRegistro} 
          disabled={isLoading}
          className="shadow-sm"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyRegistrationForm
          date={date}
          onDateChange={setDate}
          leadsRecebidos={leadsRecebidos}
          onLeadsChange={setLeadsRecebidos}
          prospeccao={prospeccao}
          onProspeccaoChange={setProspeccao}
          conexao={conexao}
          onConexaoChange={setConexao}
          onSave={handleSaveRegistro}
          isLoading={isLoading}
        />
        <SDRInputTable
          sdrMapping={sdrMapping}
          sdrData={sdrData}
          onSdrDataChange={handleSdrDataChange}
        />
      </div>
    </div>
  );
}
