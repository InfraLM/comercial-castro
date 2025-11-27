import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useUserMapping } from "@/contexts/UserMappingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyRegistrationForm } from "@/components/clint/DailyRegistrationForm";
import { SDRInputTable } from "@/components/clint/SDRInputTable";
import { ClintKPICards } from "@/components/clint/ClintKPICards";
import { SDRPerformanceChart } from "@/components/clint/SDRPerformanceChart";
import { DailyMetricsChart } from "@/components/clint/DailyMetricsChart";
import { SDRRankingTable } from "@/components/clint/SDRRankingTable";
import { useSDRPerformance, useDailyMetrics, useClintTotals } from "@/hooks/useClintAnalytics";

export default function Clint() {
  const [date, setDate] = useState<Date>(new Date());
  const [leadsRecebidos, setLeadsRecebidos] = useState("");
  const [prospeccao, setProspeccao] = useState("");
  const [conexao, setConexao] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sdrMapping } = useUserMapping();

  const [sdrData, setSdrData] = useState<Record<string, { ligacoes: string; whatsapp: string; tempo: string }>>({});

  // Analytics hooks
  const { data: sdrPerformance = [], isLoading: loadingSDR } = useSDRPerformance();
  const { data: dailyMetrics = [], isLoading: loadingMetrics } = useDailyMetrics();
  const { data: totals = [], isLoading: loadingTotals } = useClintTotals();

  const totalsData = totals[0] || {
    total_ligacoes: 0,
    total_whatsapp: 0,
    total_leads: 0,
    total_prospeccao: 0,
    total_conexao: 0,
  };

  const handleSaveRegistro = async () => {
    if (!leadsRecebidos && !prospeccao && !conexao) {
      toast.error("Preencha pelo menos um campo do registro diário");
      return;
    }

    setIsLoading(true);

    try {
      // Format date as DD/MM/YYYY for the database
      const diaRegistro = format(date, "dd/MM/yyyy");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clint</h1>
          <p className="text-sm text-muted-foreground">Gestão de performance SDR</p>
        </div>
        <Button 
          onClick={handleSaveRegistro} 
          disabled={isLoading}
          size="default"
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
              Salvar
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      <ClintKPICards
        totalLigacoes={Number(totalsData.total_ligacoes) || 0}
        totalWhatsapp={Number(totalsData.total_whatsapp) || 0}
        totalLeads={Number(totalsData.total_leads) || 0}
        totalProspeccao={Number(totalsData.total_prospeccao) || 0}
        totalConexao={Number(totalsData.total_conexao) || 0}
        isLoading={loadingTotals}
      />

      {/* Registration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SDRPerformanceChart 
          data={sdrPerformance} 
          isLoading={loadingSDR} 
        />
        <DailyMetricsChart 
          data={dailyMetrics} 
          isLoading={loadingMetrics} 
        />
      </div>

      {/* Ranking Table */}
      <SDRRankingTable 
        data={sdrPerformance} 
        isLoading={loadingSDR} 
      />
    </div>
  );
}
