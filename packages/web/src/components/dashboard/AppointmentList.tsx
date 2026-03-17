import { useState } from "react";
import { MoreHorizontal, Check, X, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import { toast } from "sonner";

type AppointmentStatus =
  | "CONFIRMED"
  | "PENDING"
  | "CANCELED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

interface Appointment {
  id: string;
  time: string;
  customer: string;
  service: string;
  status: AppointmentStatus;
}

interface AppointmentListProps {
  appointments: Appointment[];
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  },
  PENDING: {
    label: "Pendente",
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  },
  CANCELED: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground border-muted hover:bg-muted",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground border-muted hover:bg-muted",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  },
  NO_SHOW: {
    label: "Não compareceu",
    className: "bg-muted text-muted-foreground border-muted hover:bg-muted",
  },
};

export function AppointmentList({ appointments: initialAppointments }: AppointmentListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = (reason: string, notifyCustomer: boolean) => {
    if (selectedAppointment) {
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: "CANCELED" as const }
            : apt
        )
      );
    }
    setSelectedAppointment(null);
  };

  const handleMarkComplete = (id: string) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: "COMPLETED" as const } : apt
      )
    );
    toast.success("Agendamento marcado como concluído");
  };

  return (
    <>
      <div className="space-y-3">
        {appointments.map((appointment, index) => {
          const status = statusConfig[appointment.status];
          const isCanceled = appointment.status === "CANCELED" || appointment.status === "CANCELLED";
          const isCompleted = appointment.status === "COMPLETED";

          return (
            <Card
              key={appointment.id}
              className={cn(
                "p-4 transition-all duration-200 hover:shadow-md animate-slide-up",
                isCanceled && "opacity-60"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                {/* Time */}
                <div className="flex-shrink-0 text-center">
                  <div className={cn(
                    "text-lg font-bold",
                    isCanceled ? "text-muted-foreground line-through" : "text-primary"
                  )}>
                    {appointment.time}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-10 w-px bg-border hidden sm:block" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-foreground truncate",
                    isCanceled && "line-through text-muted-foreground"
                  )}>
                    {appointment.customer}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {appointment.service}
                  </p>
                </div>

                {/* Status Badge */}
                <Badge variant="outline" className={cn("hidden sm:flex", status.className)}>
                  {status.label}
                </Badge>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isCompleted && !isCanceled && (
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer"
                        onClick={() => handleMarkComplete(appointment.id)}
                      >
                        <Check className="h-4 w-4 text-success" />
                        Marcar como Concluído
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Clock className="h-4 w-4 text-warning" />
                      Reagendar
                    </DropdownMenuItem>
                    {!isCanceled && (
                      <DropdownMenuItem 
                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => handleCancelClick(appointment)}
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Status */}
              <div className="mt-3 sm:hidden">
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      <CancelAppointmentDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        customerName={selectedAppointment?.customer || ""}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
