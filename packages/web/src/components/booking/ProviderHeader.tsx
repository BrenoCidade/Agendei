import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProviderHeaderProps {
  name: string;
  avatar: string;
  address: string;
  isOpen?: boolean;
}

export function ProviderHeader({ name, avatar, address, isOpen = true }: ProviderHeaderProps) {
  return (
    <header className="w-full bg-card border-b border-border">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-primary-light text-primary font-semibold text-lg">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {name}
              </h1>
              <Badge 
                variant={isOpen ? "default" : "secondary"}
                className={isOpen 
                  ? "bg-success/10 text-success border-success/20 hover:bg-success/20" 
                  : "bg-muted text-muted-foreground"
                }
              >
                {isOpen ? "Aberto" : "Fechado"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm truncate">{address}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
