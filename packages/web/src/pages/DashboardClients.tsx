import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomerResponseDTO } from "@saas/shared";
import { AlertCircle, Calendar, Phone, RefreshCcw, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, getApiErrorMessage } from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function DashboardClients() {
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading, isError, error, refetch } = useQuery<
    CustomerResponseDTO[]
  >({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await api.get<CustomerResponseDTO[]>("/customers");
      return response.data;
    },
  });

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase();
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
              className="animate-slide-up p-4 transition-shadow hover:shadow-md"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary-light font-semibold text-primary">
                    {client.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
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
    </div>
  );
}
