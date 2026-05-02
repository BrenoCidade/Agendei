import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarDays, Clock, DollarSign, RefreshCcw } from "lucide-react";
import type { AppointmentResponse } from "@saas/shared";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api";

function toDateOnly(value: Date) {
  return value.toISOString().split("T")[0];
}

export default function Dashboard() {
  const today = useMemo(() => new Date(), []);
  const dateParam = useMemo(() => toDateOnly(today), [today]);

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AppointmentResponse[]>({
    queryKey: ["dashboard-appointments", dateParam],
    queryFn: async () => {
      const response = await api.get<AppointmentResponse[]>("/appointments", {
        params: {
          startDate: dateParam,
          endDate: dateParam,
        },
      });

      return response.data;
    },
  });

  const appointmentsToday = useMemo(
    () =>
      [...appointments]
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )
        .map((appointment) => ({
          id: appointment.id,
          time: new Date(appointment.startsAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          customer: appointment.customer?.name ?? "Cliente sem nome",
          service: appointment.service?.name ?? "Servico sem nome",
          status: appointment.status,
        })),
    [appointments],
  );

  const stats = useMemo(() => {
    const upcoming = appointments.find((appointment) => {
      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED" ||
        appointment.status === "NO_SHOW"
      ) {
        return false;
      }

      return new Date(appointment.startsAt).getTime() >= Date.now();
    });

    const estimatedRevenue = appointments.reduce((sum, appointment) => {
      if (
        appointment.status === "CANCELLED" ||
        appointment.status === "NO_SHOW"
      ) {
        return sum;
      }

      return sum + ((appointment.service?.priceInCents ?? 0) / 100);
    }, 0);

    return {
      todayCount: appointments.length,
      nextTime: upcoming
        ? new Date(upcoming.startsAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
      nextClient: upcoming?.customer?.name ?? "Sem proximos",
      estimatedRevenue,
    };
  }, [appointments]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Agendamentos hoje"
          value={stats.todayCount.toString()}
          icon={CalendarDays}
          variant="primary"
        />
        <StatCard
          title="Proximo cliente"
          value={stats.nextTime}
          subtitle={stats.nextClient}
          icon={Clock}
        />
        <StatCard
          title="Faturamento estimado"
          value={`R$ ${stats.estimatedRevenue.toFixed(2).replace(".", ",")}`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Agenda do dia</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nao foi possivel carregar a agenda</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{getApiErrorMessage(error, "Tente novamente em instantes.")}</p>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => void refetch()}
              >
                <RefreshCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <AppointmentList appointments={appointmentsToday} />
        )}
      </div>
    </div>
  );
}
