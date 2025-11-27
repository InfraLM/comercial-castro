import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useUserMapping } from "@/contexts/UserMappingContext";

interface SDRData {
  sdr: string;
  total_ligacoes: number;
  total_whatsapp: number;
  dias_trabalhados: number;
}

interface SDRPerformanceChartProps {
  data: SDRData[];
  isLoading?: boolean;
}

export function SDRPerformanceChart({ data, isLoading = false }: SDRPerformanceChartProps) {
  const { sdrMapping } = useUserMapping();

  const chartData = data.map((item) => ({
    name: sdrMapping[item.sdr] || item.sdr?.split("@")[0] || "N/A",
    ligacoes: Number(item.total_ligacoes) || 0,
    whatsapp: Number(item.total_whatsapp) || 0,
    dias: Number(item.dias_trabalhados) || 0,
  }));

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Performance por SDR</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
          Performance por SDR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend />
            <Bar 
              dataKey="ligacoes" 
              name="Ligações" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="whatsapp" 
              name="WhatsApp" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
