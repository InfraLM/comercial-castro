import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle, Users, Target, Zap } from "lucide-react";

interface ClintKPICardsProps {
  totalLigacoes: number;
  totalWhatsapp: number;
  totalLeads: number;
  totalProspeccao: number;
  totalConexao: number;
  isLoading?: boolean;
}

export function ClintKPICards({
  totalLigacoes,
  totalWhatsapp,
  totalLeads,
  totalProspeccao,
  totalConexao,
  isLoading = false,
}: ClintKPICardsProps) {
  const kpis = [
    {
      label: "Total Ligações",
      value: totalLigacoes,
      icon: Phone,
      gradient: "from-primary to-primary/70",
    },
    {
      label: "Total WhatsApp",
      value: totalWhatsapp,
      icon: MessageCircle,
      gradient: "from-emerald-500 to-emerald-400",
    },
    {
      label: "Leads Recebidos",
      value: totalLeads,
      icon: Users,
      gradient: "from-blue-500 to-blue-400",
    },
    {
      label: "Prospecção",
      value: totalProspeccao,
      icon: Target,
      gradient: "from-amber-500 to-amber-400",
    },
    {
      label: "Conexão",
      value: totalConexao,
      icon: Zap,
      gradient: "from-violet-500 to-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <Card
          key={kpi.label}
          className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10`} />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.gradient}`}>
                <kpi.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "..." : kpi.value.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
