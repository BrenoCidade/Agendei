import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateServiceDTO, ServiceResponseDTO, UpdateServiceDTO } from "@saas/shared";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const { data: services = [], isLoading } = useQuery<ServiceResponseDTO[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get<ServiceResponseDTO[]>("/services");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateServiceDTO) => {
      await api.post("/services", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Serviço criado com sucesso." });
      setIsDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => {
      setFormError("Nao foi possivel criar o servico.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateServiceDTO }) => {
      await api.put(`/services/${id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Serviço atualizado com sucesso." });
      setIsDialogOpen(false);
      setEditingService(null);
      setForm(EMPTY_FORM);
    },
    onError: () => {
      setFormError("Nao foi possivel atualizar o servico.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast({ title: "Serviço excluido com sucesso." });
    },
    onError: () => {
      toast({ title: "Nao foi possivel excluir o servico.", variant: "destructive" });
    },
  });

  const isSubmitting = useMemo(
    () => createMutation.isPending || updateMutation.isPending,
    [createMutation.isPending, updateMutation.isPending]
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
    if (!confirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const durationInMinutes = Number(form.durationInMinutes);
    const priceInCents = parsePriceToCents(form.price);

    if (!form.name.trim()) {
      setFormError("Informe o nome do servico.");
      return;
    }
    if (!Number.isInteger(durationInMinutes) || durationInMinutes < 15 || durationInMinutes > 480) {
      setFormError("Duracao invalida. Use entre 15 e 480 minutos.");
      return;
    }
    if (!Number.isInteger(priceInCents) || priceInCents < 0) {
      setFormError("Preco invalido.");
      return;
    }

    const payload: CreateServiceDTO = {
      name: form.name,
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
          <h2 className="text-lg font-semibold text-foreground">Meus Serviços</h2>
          <p className="text-sm text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        <Button className="gap-2" onClick={handleCreateClick}>
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando servicos...</p>}

      {!isLoading && services.length === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Voce ainda nao cadastrou servicos.
        </Card>
      )}

      <div className="grid gap-4">
        {services.map((service, index) => (
          <Card
            key={service.id}
            className="p-4 animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{service.name}</h3>
                  <Badge
                    variant="outline"
                    className={service.isActive
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {service.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    R$ {(service.priceInCents / 100).toFixed(2).replace(".", ",")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {service.durationInMinutes} min
                  </span>
                </div>
                {service.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
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
                  onClick={() => handleDeleteClick(service.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              {editingService
                ? "Atualize os dados do serviço para refletir sua operação atual."
                : "Preencha as informações do serviço que sera oferecido."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex.: Corte social"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Descricao</Label>
              <Textarea
                id="service-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes do que esta incluso no atendimento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-duration">Duracao (min)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min={15}
                  max={480}
                  step={5}
                  value={form.durationInMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, durationInMinutes: e.target.value }))
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
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="45,00"
                  required
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
