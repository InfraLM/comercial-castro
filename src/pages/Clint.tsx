import { ClintKPICards } from "@/components/clint/ClintKPICards";
import { SDRPerformanceChart } from "@/components/clint/SDRPerformanceChart";
import { DailyMetricsChart } from "@/components/clint/DailyMetricsChart";
import { SDRRankingTable } from "@/components/clint/SDRRankingTable";
import { useSDRPerformance, useDailyMetrics, useClintTotals } from "@/hooks/useClintAnalytics";

export default function Clint() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clint</h1>
        <p className="text-sm text-muted-foreground">Dashboard de performance SDR</p>
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
