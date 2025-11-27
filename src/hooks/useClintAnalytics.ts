import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SDRPerformance {
  sdr: string;
  total_ligacoes: number;
  total_whatsapp: number;
  dias_trabalhados: number;
}

interface DailyMetric {
  dia_registro: string;
  leads_recebidos: number;
  prospeccao: number;
  conexao: number;
}

interface Totals {
  total_ligacoes: number;
  total_whatsapp: number;
  total_leads: number;
  total_prospeccao: number;
  total_conexao: number;
}

async function fetchClintData(type: string, dateFrom?: string, dateTo?: string) {
  const { data, error } = await supabase.functions.invoke("clint-analytics", {
    body: { type, dateFrom, dateTo },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data?.data || [];
}

export function useSDRPerformance(dateFrom?: string, dateTo?: string) {
  return useQuery<SDRPerformance[]>({
    queryKey: ["clint-sdr-performance", dateFrom, dateTo],
    queryFn: () => fetchClintData("sdr_performance", dateFrom, dateTo),
    refetchInterval: 30000,
  });
}

export function useDailyMetrics(dateFrom?: string, dateTo?: string) {
  return useQuery<DailyMetric[]>({
    queryKey: ["clint-daily-metrics", dateFrom, dateTo],
    queryFn: () => fetchClintData("daily_metrics", dateFrom, dateTo),
    refetchInterval: 30000,
  });
}

export function useClintTotals(dateFrom?: string, dateTo?: string) {
  return useQuery<Totals[]>({
    queryKey: ["clint-totals", dateFrom, dateTo],
    queryFn: () => fetchClintData("totals", dateFrom, dateTo),
    refetchInterval: 30000,
  });
}
