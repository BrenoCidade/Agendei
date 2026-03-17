import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, Clock, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

const DEFAULT_PUBLIC_SLUG =
  import.meta.env.VITE_PUBLIC_PROVIDER_SLUG ?? "barbearia-estilo";

interface Appointment {
  id: string;
  serviceName: string;
  providerName: string;
  startsAt: string;
  endsAt: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
}

export function ClientAppointmentsManager() {
  const PAGE_SIZE = 5;

  const [slug, setSlug] = useState(DEFAULT_PUBLIC_SLUG);
  const [phone, setPhone] = useState("");
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Appointment["status"]>("ALL");
  const [searchFilter, setSearchFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (payload: { slug: string; phone: string }) => {
      const res = await api.get<Appointment[]>(`/public/${payload.slug}/appointments`, {
        params: { phone: payload.phone },
      });

      return res.data;
    },
    onSuccess: (data) => {
      setAppointments(data);
    },
    onError: () => {
      toast.error("Nao foi possivel buscar agendamentos");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (payload: { slug: string; phone: string; appointmentId: string }) => {
      await api.patch(`/public/${payload.slug}/appointments/${payload.appointmentId}/cancel`, {
        phone: payload.phone,
        reason: "Cancelado pelo cliente na area publica",
      });
    },
    onSuccess: () => {
      setAppointments((prev) =>
        prev?.map((appointment) =>
          appointment.id === selectedAppointment?.id
            ? { ...appointment, status: "CANCELLED" as const }
            : appointment,
        ) ?? null,
      );
      toast.success("Agendamento cancelado com sucesso");
    },
    onError: () => {
      toast.error("Nao foi possivel cancelar o agendamento");
    },
    onSettled: () => {
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    },
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSearch = () => {
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      toast.error("Digite um número de celular válido");
      return;
    }

    if (!slug.trim()) {
      toast.error("Informe o slug do estabelecimento");
      return;
    }

    searchMutation.mutate({ slug, phone: normalizedPhone });
    setCurrentPage(1);
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedAppointment) {
      return;
    }

    cancelMutation.mutate({
      slug,
      phone: phone.replace(/\D/g, ""),
      appointmentId: selectedAppointment.id,
    });
  };

  const getStatusBadge = (status: Appointment["status"]) => {
    const variants = {
      CONFIRMED: { className: "bg-success/10 text-success border-success/20", label: "Confirmado" },
      PENDING: { className: "bg-warning/10 text-warning border-warning/20", label: "Pendente" },
      CANCELLED: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "Cancelado" },
      COMPLETED: { className: "bg-primary/10 text-primary border-primary/20", label: "Concluido" },
      NO_SHOW: { className: "bg-muted text-muted-foreground border-border", label: "Nao compareceu" },
    };
    const { className, label } = variants[status];
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const formatAppointmentDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatAppointmentTime = (isoDate: string) =>
    new Date(isoDate).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const filteredAppointments = useMemo(() => {
    if (!appointments) {
      return [];
    }

    const normalizedSearch = searchFilter.trim().toLowerCase();

    return appointments.filter((apt) => {
      if (statusFilter !== "ALL" && apt.status !== statusFilter) {
        return false;
      }

      if (normalizedSearch) {
        const matchesSearch =
          apt.serviceName.toLowerCase().includes(normalizedSearch) ||
          apt.providerName.toLowerCase().includes(normalizedSearch);
        if (!matchesSearch) {
          return false;
        }
      }

      const appointmentDate = apt.startsAt.slice(0, 10);
      if (fromDateFilter && appointmentDate < fromDateFilter) {
        return false;
      }
      if (toDateFilter && appointmentDate > toDateFilter) {
        return false;
      }

      return true;
    });
  }, [appointments, statusFilter, searchFilter, fromDateFilter, toDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredAppointments.slice(start, end);
  }, [currentPage, filteredAppointments]);

  const clearFilters = () => {
    setStatusFilter("ALL");
    setSearchFilter("");
    setFromDateFilter("");
    setToDateFilter("");
    setCurrentPage(1);
  };

  if (!appointments) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Gerenciar meus horários</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Digite seu celular para consultar seus agendamentos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="slug-do-negocio"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="text-center"
              />
              <Input
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="text-center text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              className="w-full"
              disabled={searchMutation.isPending}
            >
              <Search className="w-4 h-4 mr-2" />
              {searchMutation.isPending ? "Buscando..." : "Buscar Agendamentos"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Meus Agendamentos</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setAppointments(null)}
          >
            Nova busca
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Encontrados {filteredAppointments.length} agendamento(s) para {phone}
        </p>

        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Filtrar por servico ou profissional"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value: "ALL" | Appointment["status"]) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="COMPLETED">Concluido</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="NO_SHOW">Nao compareceu</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={fromDateFilter}
                onChange={(e) => {
                  setFromDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <Input
                type="date"
                value={toDateFilter}
                onChange={(e) => {
                  setToDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {paginatedAppointments.map((apt) => (
            <Card key={apt.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Date/Time Section */}
                  <div className="flex flex-col items-center justify-center bg-primary/5 rounded-lg p-3 min-w-[70px]">
                    <span className="text-xs text-muted-foreground uppercase">
                      {formatAppointmentDate(apt.startsAt)}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatAppointmentTime(apt.startsAt)}
                    </span>
                  </div>

                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{apt.serviceName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{apt.providerName}</p>
                    <div className="mt-2">
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  {/* Cancel Button */}
                  {apt.status !== "CANCELLED" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelClick(apt)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAppointments.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nenhum agendamento encontrado para os filtros selecionados.
              </CardContent>
            </Card>
          )}
        </div>

        {filteredAppointments.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Proxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O horário ficará livre para outro cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? "Cancelando..." : "Sim, Cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
