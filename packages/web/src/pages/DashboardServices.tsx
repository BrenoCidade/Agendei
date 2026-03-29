import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateServiceDTO,
  ServiceResponseDTO,
  UpdateServiceDTO,
} from "@saas/shared";
import {
  AlertCircle,
  Clock,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

interface ServiceFormState {
  name: string;
  description: string;
  durationInMinutes: string;
  price: string;
}

const EMPTY_FORM: ServiceFormState = {
  name: "",
  description: "",
  durationInMinutes: "30",
  price: "",
};

function mapServiceToForm(service: ServiceResponseDTO): ServiceFormState {
  return {
    name: service.name,
    description: service.description ?? "",
    durationInMinutes: String(service.durationInMinutes),
    price: (service.priceInCents / 100).toFixed(2).replace(".", ","),
  };
}

function parsePriceToCents(rawPrice: string): number {
  const normalized = rawPrice.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

export default function DashboardServices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceResponseDTO | null>(null);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: services = [], isLoading, isError, error, refetch } = useQuery<
    ServiceResponseDTO[]
  >({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await api.get<ServiceResponseDTO[]>("/services");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateServiceDTO) => {
      await api.post("/services", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servico criado com sucesso." });
      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (mutationError) => {
      setFormError(
        getApiErrorMessage(mutationError, "Nao foi possivel criar o servico."),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateServiceDTO;
    }) => {
      await api.put(`/services/${id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servico atualizado com sucesso." });
      setIsDialogOpen(false);
      setEditingService(null);
      setForm(EMPTY_FORM);
    },
    onError: (mutationError) => {
      setFormError(
        getApiErrorMessage(mutationError, "Nao foi possivel atualizar o servico."),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Servico excluido com sucesso." });
    },
    onError: (mutationError) => {
      toast({
        title: getApiErrorMessage(
          mutationError,
          "Nao foi possivel excluir o servico.",
        ),
        variant: "destructive",
      });
    },
  });

  const isSubmitting = useMemo(
    () => createMutation.isPending || updateMutation.isPending,
    [createMutation.isPending, updateMutation.isPending],
  );

  const handleCreateClick = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (service: ServiceResponseDTO) => {
    setEditingService(service);
    setForm(mapServiceToForm(service));
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este servico?");
    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync(id);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const durationInMinutes = Number(form.durationInMinutes);
    const priceInCents = parsePriceToCents(form.price);

    if (!form.name.trim()) {
      setFormError("Informe o nome do servico.");
      return;
    }

    if (
      !Number.isInteger(durationInMinutes) ||
      durationInMinutes < 15 ||
      durationInMinutes > 480
    ) {
      setFormError("Duracao invalida. Use entre 15 e 480 minutos.");
      return;
    }

    if (!Number.isInteger(priceInCents) || priceInCents < 0) {
      setFormError("Preco invalido.");
      return;
    }

    const payload: CreateServiceDTO = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationInMinutes,
      priceInCents,
      isActive: true,
    };

    if (editingService) {
      await updateMutation.mutateAsync({ id: editingService.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Meus servicos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os servicos oferecidos
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreateClick}>
          <Plus className="h-4 w-4" />
          Novo servico
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-3 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nao foi possivel carregar os servicos</AlertTitle>
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
      )}

      {!isLoading && !isError && services.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Voce ainda nao cadastrou servicos reais.
        </Card>
      )}

      {!isLoading && !isError && (
        <div className="grid gap-4">
          {services.map((service, index) => (
            <Card
              key={service.id}
              className="animate-slide-up p-4"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{service.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        service.isActive
                          ? "border-success/20 bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {service.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      R$ {(service.priceInCents / 100).toFixed(2).replace(".", ",")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {service.durationInMinutes} min
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditClick(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => void handleDeleteClick(service.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar servico" : "Novo servico"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Atualize os dados do servico para refletir sua operacao atual."
                : "Preencha as informacoes do servico que sera oferecido."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Ex.: Corte social"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Descricao</Label>
              <Textarea
                id="service-description"
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Detalhes do que esta incluso no atendimento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-duration">Duracao (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min={15}
                  max={480}
                  step={5}
                  value={form.durationInMinutes}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      durationInMinutes: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">Preco (R$)</Label>
                <Input
                  id="service-price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, price: event.target.value }))
                  }
                  placeholder="45,00"
                  required
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Salvando..."
                  : editingService
                    ? "Salvar alteracoes"
                    : "Criar servico"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
