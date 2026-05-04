import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AppointmentResponse, CustomerResponseDTO } from "@saas/shared";
import {
  AlertCircle,
  Calendar,
  Clock,
  Mail,
  Phone,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-success/10 text-success border-success/20",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-muted text-muted-foreground border-muted",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  NO_SHOW: {
    label: "Não compareceu",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardClients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] =
    useState<CustomerResponseDTO | null>(null);

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CustomerResponseDTO[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get<CustomerResponseDTO[]>("/customers");
      return response.data;
    },
  });

  const { data: allAppointments = [], isLoading: isLoadingAppointments } =
    useQuery<AppointmentResponse[]>({
      queryKey: ["appointments", "all-history"],
      queryFn: async () => {
        const response = await api.get<AppointmentResponse[]>("/appointments", {
          params: {
            startDate: "2020-01-01",
            endDate: "2030-12-31",
          },
        });
        return response.data;
      },
      enabled: !!selectedClient,
    });

  const clientAppointments = useMemo(() => {
    if (!selectedClient) return [];
    return allAppointments
      .filter((apt) => apt.customerId === selectedClient.id)
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
  }, [allAppointments, selectedClient]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return customers;
    return customers.filter((customer) => {
      const haystack =
        `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [customers, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
        <p className="text-sm text-muted-foreground">
          Visualize os clientes reais cadastrados no seu negocio
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="h-11 pl-10"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando clientes...</p>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nao foi possivel carregar os clientes</AlertTitle>
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
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {customers.length === 0
            ? "Nenhum cliente real apareceu por aqui ainda."
            : "Nenhum cliente encontrado para essa busca."}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((client, index) => (
            <Card
              key={client.id}
              className="animate-slide-up cursor-pointer p-4 transition-shadow hover:shadow-md"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary-light font-semibold text-primary">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground">{client.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Cliente desde {formatDate(client.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {client.email}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedClient}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null);
        }}
      >
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary-light text-lg font-semibold text-primary">
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-left">
                      {selectedClient.name}
                    </DialogTitle>
                    <DialogDescription className="text-left">
                      Cliente desde {formatDate(selectedClient.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{selectedClient.phone}</span>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Agendamentos</h4>
                  {isLoadingAppointments ? (
                    <p className="text-sm text-muted-foreground">
                      Carregando agendamentos...
                    </p>
                  ) : clientAppointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum agendamento encontrado para este cliente.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {clientAppointments.map((apt) => {
                        const status =
                          statusConfig[apt.status] ?? statusConfig.PENDING;
                        return (
                          <div
                            key={apt.id}
                            className="rounded-md border p-3 text-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {apt.service?.name ?? "Serviço"}
                                </p>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatDateTime(apt.startsAt)}</span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={status.className}
                              >
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
