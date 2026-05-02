import { Menu, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function DashboardHeader({ title, onMenuClick }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = getInitials(user?.name);
  const displayName = user?.name || "Usuário";
  const displayEmail = user?.email || "";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg md:text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${initials}&background=0D8BFF&color=fff`} alt={displayName} />
              <AvatarFallback className="bg-primary-light text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 p-3 overflow-hidden">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${initials}&background=0D8BFF&color=fff`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate" title={displayName}>{displayName}</span>
              <span className="text-xs text-muted-foreground truncate" title={displayEmail}>{displayEmail}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/dashboard/settings")}>
            <User className="h-4 w-4" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
