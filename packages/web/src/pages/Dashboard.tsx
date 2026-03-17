import { CalendarDays, Clock, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AppointmentResponse, ServiceResponseDTO } from "@saas/shared";
import { StatCard } from "@/components/dashboard/StatCard";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { api } from "@/lib/api";

function toDateOnly(value: Date) {
  return value.toISOString().split("T")[0];
}

export default function Dashboard() {
  const today = useMemo(() => new Date(), []);
  const dateParam = useMemo(() => toDateOnly(today), [today]);

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<AppointmentResponse[]>({
    queryKey: ["dashboard-appointments", dateParam],
    queryFn: async () => {
      const res = await api.get<AppointmentResponse[]>("/appointments", {
        params: {
          startDate: dateParam,
          endDate: dateParam,
        },
      });

      return res.data;
    },
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery<ServiceResponseDTO[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get<ServiceResponseDTO[]>("/services");
      return res.data;
    },
  });

  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );

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
          customer: `Cliente #${appointment.customerId.slice(0, 6)}`,
          service: serviceById.get(appointment.serviceId)?.name ?? "Servico",
          status: appointment.status,
        })),
    [appointments, serviceById],
  );

  const stats = useMemo(() => {
    const upcoming = appointmentsToday.find(
      (apt) =>
        apt.status !== "CANCELLED" &&
        apt.status !== "COMPLETED" &&
        apt.status !== "NO_SHOW" &&
        new Date(`${dateParam}T${apt.time}:00`).getTime() >= Date.now(),
    );

    const estRevenue = appointments.reduce((sum, appointment) => {
      if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
        return sum;
      }

      const service = serviceById.get(appointment.serviceId);
      return sum + (service ? service.priceInCents / 100 : 0);
    }, 0);

    return {
      todayCount: appointments.length,
      nextTime: upcoming ? upcoming.time : "--:--",
      nextClient: upcoming ? upcoming.customer : "Sem proximos",
      estRevenue,
    };
  }, [appointments, appointmentsToday, dateParam, serviceById]);

  const isLoading = isLoadingAppointments || isLoadingServices;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Agendamentos Hoje"
          value={stats.todayCount.toString()}
          icon={CalendarDays}
          variant="primary"
        />
        <StatCard
          title="Próximo Cliente"
          value={stats.nextTime}
          subtitle={stats.nextClient}
          icon={Clock}
        />
        <StatCard
          title="Faturamento Estimado"
          value={`R$ ${stats.estRevenue.toFixed(2).replace(".", ",")}`}
          icon={DollarSign}
          variant="success"
        />
      </div>

      {/* Appointments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Agenda do Dia
          </h2>
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
        ) : (
          <AppointmentList appointments={appointmentsToday} />
        )}
      </div>
    </div>
  );
}
