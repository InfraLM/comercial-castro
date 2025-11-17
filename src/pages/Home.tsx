import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, Users } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Bem-vindo ao Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema de reuniões comerciais</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">Em breve</div>
              <p className="text-xs text-muted-foreground mt-1">
                Estatísticas em desenvolvimento
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">Em breve</div>
              <p className="text-xs text-muted-foreground mt-1">
                Análises em desenvolvimento
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipe Ativa</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">Em breve</div>
              <p className="text-xs text-muted-foreground mt-1">
                Informações em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-2">
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Acesse a aba <strong className="text-primary">Reuniões</strong> para visualizar e gerenciar as reuniões
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Use o <strong className="text-primary">Administrador</strong> para configurar opções e mapeamentos
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Dashboards e estatísticas serão implementados em breve
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
