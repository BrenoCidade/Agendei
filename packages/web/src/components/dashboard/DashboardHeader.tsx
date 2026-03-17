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

interface DashboardHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function DashboardHeader({ title, onMenuClick }: DashboardHeaderProps) {
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
              <AvatarImage src="https://github.com/shadcn.png" alt="Usuário" />
              <AvatarFallback className="bg-primary-light text-primary font-semibold">
                BE
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>BE</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Barbearia Estilo</span>
              <span className="text-xs text-muted-foreground">contato@barbearia.com</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
