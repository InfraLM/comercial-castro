import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FupForecastParams {
  data_inicio: string;
  data_fim: string;
  data_inicio_anterior: string;
  data_fim_anterior: string;
}

export interface FunilData {
  leads_recebido: number;
  prospeccao: number;
  conexao: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
  vendas: number;
}

export interface SDRProdutividadeData {
  sdr: string;
  ligacoes: number;
  tempo_segundos: number;
  whatsapp: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
}

export interface ConversaoSDRData {
  sdr: string;
  reunioes_realizadas: number;
  vendas: number;
}

export interface ConversaoCloserData {
  closer: string;
  reunioes_realizadas: number;
  vendas: number;
}

export interface VendasProdutoData {
  produto: string;
  total: number;
  vendas_sdr: number;
  vendas_closer: number;
}

export interface FinanciamentoData {
  com_financiamento: number;
  sem_financiamento: number;
}

export interface VendasProdutoResponse {
  produtos: VendasProdutoData[];
  financiamento: FinanciamentoData;
}

export function useFunilComercial(params: FupForecastParams) {
  return useQuery({
    queryKey: ["fup-forecast-funil", params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-funil", {
        body: params
      });
      if (error) throw error;
      return data as { semana_atual: FunilData; semana_anterior: FunilData };
    },
    refetchInterval: 60000,
  });
}

interface ProdutividadeSDRParams {
  data_inicio: string;
  data_fim: string;
  data_inicio_anterior: string;
  data_fim_anterior: string;
}

export interface ProdutividadeSDRResponse {
  semana_atual: SDRProdutividadeData[];
  semana_anterior: SDRProdutividadeData[];
}

export function useProdutividadeSDR(params: ProdutividadeSDRParams) {
  return useQuery({
    queryKey: ["fup-forecast-sdr-produtividade", params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-sdr-produtividade", {
        body: params
      });
      if (error) throw error;
      return data as ProdutividadeSDRResponse;
    },
    refetchInterval: 60000,
  });
}

export function useConversaoSDR(data_inicio: string, data_fim: string) {
  return useQuery({
    queryKey: ["fup-forecast-conversao-sdr", data_inicio, data_fim],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-conversao", {
        body: { data_inicio, data_fim, tipo: "sdr" }
      });
      if (error) throw error;
      return data as ConversaoSDRData[];
    },
    refetchInterval: 60000,
  });
}

export function useConversaoCloser(data_inicio: string, data_fim: string) {
  return useQuery({
    queryKey: ["fup-forecast-conversao-closer", data_inicio, data_fim],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-conversao", {
        body: { data_inicio, data_fim, tipo: "closer" }
      });
      if (error) throw error;
      return data as ConversaoCloserData[];
    },
    refetchInterval: 60000,
  });
}

export function useVendasProduto(data_inicio: string, data_fim: string) {
  return useQuery({
    queryKey: ["fup-forecast-vendas-produto", data_inicio, data_fim],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-vendas-produto", {
        body: { data_inicio, data_fim }
      });
      if (error) throw error;
      return data as VendasProdutoResponse;
    },
    refetchInterval: 60000,
  });
}

export interface AIAnalysisData {
  highs: string[];
  lows: string[];
}

export function useAIAnalysis(weekData: any, currentWeek: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ["fup-forecast-ai-analysis", weekData, currentWeek],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-ai-analysis", {
        body: { weekData, currentWeek }
      });
      if (error) throw error;
      return data.analysis as AIAnalysisData;
    },
    enabled,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}
