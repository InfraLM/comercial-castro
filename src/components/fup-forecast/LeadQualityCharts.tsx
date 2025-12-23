import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface LeadQualityData {
  sdr: string;
  qualidade_lead: string;
  quantidade: number;
}

interface LeadQualityChartsProps {
  data_inicio: string;
  data_fim: string;
}

// Ordem definida das qualidades
const QUALITY_ORDER = ["A", "B", "C", "R", "Outros produtos", "Abandono de formulario", "Red November", "Indicacao"];

// Cores consistentes para cada qualidade (usadas em ambos os gráficos)
const QUALITY_COLORS: Record<string, string> = {
  "A": "#22c55e",           // Verde
  "B": "#3b82f6",           // Azul
  "C": "#f59e0b",           // Amarelo/Laranja
  "R": "#ef4444",           // Vermelho
  "Outros produtos": "#8b5cf6",  // Roxo
  "Abandono de formulario": "#06b6d4",  // Ciano
  "Abandono de formulário": "#06b6d4",  // Ciano (variação)
  "Red November": "#ec4899",     // Rosa
  "Indicacao": "#14b8a6",        // Teal
  "Não informado": "#6b7280",    // Cinza
};

// Função para obter cor consistente
const getQualityColor = (quality: string): string => {
  // Normalizar o nome da qualidade para buscar a cor
  const normalizedQuality = quality.trim();
  return QUALITY_COLORS[normalizedQuality] || "#6b7280";
};

export function LeadQualityCharts({ data_inicio, data_fim }: LeadQualityChartsProps) {
  const { getSdrName } = useUserMapping();

  const { data, isLoading } = useQuery({
    queryKey: ["lead-quality", data_inicio, data_fim],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fup-forecast-lead-quality", {
        body: { data_inicio, data_fim },
      });
      if (error) throw error;
      return data.data as LeadQualityData[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agregar dados por qualidade para o gráfico de colunas
  const qualityTotals = (data || []).reduce((acc, item) => {
    const quality = item.qualidade_lead || "Não informado";
    acc[quality] = (acc[quality] || 0) + item.quantidade;
    return acc;
  }, {} as Record<string, number>);

  // Ordenar dados conforme a ordem definida
  const qualityData = Object.entries(qualityTotals)
    .map(([name, value]) => ({ name, value, fill: getQualityColor(name) }))
    .sort((a, b) => {
      const indexA = QUALITY_ORDER.indexOf(a.name);
      const indexB = QUALITY_ORDER.indexOf(b.name);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

  // Agregar dados por SDR para o gráfico de barras
  const sdrData = (data || []).reduce((acc, item) => {
    const sdrName = getSdrName(item.sdr) || item.sdr;
    if (!acc[sdrName]) {
      acc[sdrName] = { sdr: sdrName };
    }
    const quality = item.qualidade_lead || "Não informado";
    acc[sdrName][quality] = (acc[sdrName][quality] || 0) + item.quantidade;
    return acc;
  }, {} as Record<string, any>);

  const barData = Object.values(sdrData);
  // Ordenar qualidades conforme a ordem definida
  const allQualities = [...new Set((data || []).map(d => d.qualidade_lead || "Não informado"))]
    .sort((a, b) => {
      const indexA = QUALITY_ORDER.indexOf(a);
      const indexB = QUALITY_ORDER.indexOf(b);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

  const totalLeads = qualityData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Colunas - Qualidade de Leads */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Qualidade dos Leads
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {totalLeads} leads abordados
          </p>
        </CardHeader>
        <CardContent>
          {qualityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => [value, "Quantidade"]}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Leads por SDR */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Leads por SDR
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribuição de qualidade por SDR
          </p>
        </CardHeader>
        <CardContent>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="sdr" 
                  width={90} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {allQualities.map((quality, index) => (
                  <Bar 
                    key={quality} 
                    dataKey={quality} 
                    stackId="a" 
                    fill={getQualityColor(quality)}
                    name={quality}
                    radius={index === allQualities.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
