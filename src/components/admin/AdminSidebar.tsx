import { Database, Users, Settings, ClipboardList, ChevronLeft, Home, Calendar, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const mainSections = [
  { id: "home", title: "Home", icon: Home },
  { id: "reunioes", title: "Reuniões", icon: Calendar },
  { id: "clint-dashboard", title: "Dashboard Clint", icon: BarChart3 },
];

const adminSections = [
  { id: "database", title: "Banco de Dados", icon: Database },
  { id: "users", title: "Usuários", icon: Users },
  { id: "meetings", title: "Configuração de Reuniões", icon: Settings },
  { id: "clint", title: "Registro Clint", icon: ClipboardList },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <div className="w-64 min-h-full bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <NavLink to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Voltar ao FUP/Forecast
          </Button>
        </NavLink>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold text-foreground mb-1">Portal Admin</h2>
        <p className="text-sm text-muted-foreground">Gerenciamento do sistema</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Páginas</p>
          {mainSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="h-5 w-5" />
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        <div>
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações</p>
          {adminSections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeSection === section.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="h-5 w-5" />
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
