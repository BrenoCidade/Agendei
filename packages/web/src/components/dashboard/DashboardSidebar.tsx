import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, Scissors, Users, Settings, LogOut, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Agenda", path: "/dashboard", icon: CalendarDays },
  { label: "Meus Serviços", path: "/dashboard/services", icon: Scissors },
  { label: "Clientes", path: "/dashboard/clients", icon: Users },
  { label: "Configurações", path: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const location = useLocation();

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Agendei</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
