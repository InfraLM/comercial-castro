import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(48, 96%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(24, 94%, 50%)",
];

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

  // Agregar dados por qualidade para o gráfico de pizza
  const qualityTotals = (data || []).reduce((acc, item) => {
    const quality = item.qualidade_lead || "Não informado";
    acc[quality] = (acc[quality] || 0) + item.quantidade;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(qualityTotals).map(([name, value]) => ({
    name,
    value,
  }));

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
  const allQualities = [...new Set((data || []).map(d => d.qualidade_lead || "Não informado"))];

  const totalLeads = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Qualidade de Leads */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Qualidade dos Leads
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {totalLeads} leads abordados
          </p>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, "Quantidade"]}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
              </PieChart>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="sdr" 
                  width={80} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                {allQualities.map((quality, index) => (
                  <Bar 
                    key={quality} 
                    dataKey={quality} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]}
                    name={quality}
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
