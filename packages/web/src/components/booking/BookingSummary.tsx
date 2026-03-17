import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

interface BookingSummaryProps {
  service: Service | null;
  date: Date | undefined;
  time: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  isConfirming?: boolean;
  onConfirm: () => void;
}

export function BookingSummary({
  service,
  date,
  time,
  customerName,
  customerEmail,
  customerPhone,
  isConfirming = false,
  onConfirm,
}: BookingSummaryProps) {
  const isComplete = service && date && time && customerName && customerEmail && customerPhone;

  if (!service) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 animate-slide-up">
      <div className="container max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-foreground">
              <Scissors className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium truncate">{service.name}</span>
            </div>
            
            {date && time && (
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(date, "dd/MM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{time}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-lg font-bold text-primary">
                R$ {service.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <Button
              onClick={onConfirm}
              disabled={!isComplete || isConfirming}
              className={cn(
                "h-12 px-6 rounded-xl font-semibold transition-all duration-200",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isConfirming ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
