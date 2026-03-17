import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: (service: Service) => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect(service)}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        isSelected 
          ? "border-primary bg-primary-light shadow-sm" 
          : "border-border bg-card"
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-base",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {service.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {service.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{service.duration}</span>
          </div>
        </div>
        
        <div className={cn(
          "text-lg font-semibold whitespace-nowrap",
          isSelected ? "text-primary" : "text-foreground"
        )}>
          R$ {service.price.toFixed(2).replace('.', ',')}
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-primary">Selecionado</span>
        </div>
      )}
    </button>
  );
}
