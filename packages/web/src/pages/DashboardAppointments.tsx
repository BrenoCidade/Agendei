import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { AppointmentResponse } from "@saas/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { api, getApiErrorMessage } from "@/lib/api";

type StatusFilter =
  | "ALL"
  | "CONFIRMED"
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

function toDateOnly(value: Date) {
  return value.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

type QuickRange = "today" | "week" | "month" | "custom";

const statusLabels: Record<StatusFilter, string> = {
  ALL: "Todos",
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const statusBadgeClass: Record<StatusFilter, string> = {
  ALL: "",
  CONFIRMED: "bg-success/10 text-success border-success/20",
  PENDING: "bg-warning/10 text-warning border-warning/20",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
  CANCELLED: "bg-muted text-muted-foreground border-muted",
  NO_SHOW: "bg-muted text-muted-foreground border-muted",
};

export default function DashboardAppointments() {
  const today = useMemo(() => new Date(), []);

  const [quickRange, setQuickRange] = useState<QuickRange>("week");
  const [startDate, setStartDate] = useState(() => toDateOnly(startOfWeek(today)));
  const [endDate, setEndDate] = useState(() => toDateOnly(endOfWeek(today)));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const handleQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    if (range === "today") {
      setStartDate(toDateOnly(today));
      setEndDate(toDateOnly(today));
    } else if (range === "week") {
      setStartDate(toDateOnly(startOfWeek(today)));
      setEndDate(toDateOnly(endOfWeek(today)));
    } else if (range === "month") {
      setStartDate(toDateOnly(startOfMonth(today)));
      setEndDate(toDateOnly(endOfMonth(today)));
    }
    // "custom" — let user pick dates manually
  };

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AppointmentResponse[]>({
    queryKey: ["all-appointments", startDate, endDate],
    queryFn: async () => {
      const response = await api.get<AppointmentResponse[]>("/appointments", {
        params: { startDate, endDate },
      });
      return response.data;
    },
  });

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...appointments]
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
      .filter((a) => {
        if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
        if (normalizedSearch) {
          const haystack =
            `${a.customer?.name ?? ""} ${a.service?.name ?? ""}`.toLowerCase();
          if (!haystack.includes(normalizedSearch)) return false;
        }
        return true;
      })
      .map((appointment) => ({
        id: appointment.id,
        time: new Date(appointment.startsAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customer: appointment.customer?.name ?? "Cliente sem nome",
        service: appointment.service?.name ?? "Serviço sem nome",
        status: appointment.status,
      }));
  }, [appointments, statusFilter, search]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of appointments) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }, [appointments]);

  const quickRangeButtons: { label: string; value: QuickRange }[] = [
    { label: "Hoje", value: "today" },
    { label: "Esta semana", value: "week" },
    { label: "Este mês", value: "month" },
    { label: "Personalizado", value: "custom" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Todos os Agendamentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Visualize e filtre todos os seus agendamentos por período e status
        </p>
      </div>

      {/* Quick Range Selector */}
      <div className="flex flex-wrap gap-2">
        {quickRangeButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={quickRange === btn.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuickRange(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Date Pickers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="startDate"
            className="text-xs font-medium text-muted-foreground"
          >
            Data inicial
          </label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setQuickRange("custom");
            }}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="endDate"
            className="text-xs font-medium text-muted-foreground"
          >
            Data final
          </label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setQuickRange("custom");
            }}
          />
        </div>
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou serviço..."
            className="h-11 pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-11 gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(statusLabels) as StatusFilter[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary badges */}
      {!isLoading && !isError && appointments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {filtered.length} de {appointments.length} agendamentos
          </Badge>
          {Object.entries(countByStatus).map(([status, count]) => (
            <Badge
              key={status}
              variant="outline"
              className={
                statusBadgeClass[status as StatusFilter] ??
                "bg-muted text-muted-foreground"
              }
            >
              {statusLabels[status as StatusFilter] ?? status}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando agendamentos...
        </p>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar os agendamentos</AlertTitle>
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
        <AppointmentList appointments={filtered} />
      )}
    </div>
  );
}
