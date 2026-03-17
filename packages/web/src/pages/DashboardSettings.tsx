import { Store, Bell, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilitySettings } from "@/components/dashboard/AvailabilitySettings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserResponseDTO, UpdateBusinessProfileDTO } from "@saas/shared";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get<UserResponseDTO>("/profile/me");
      return res.data;
    },
  });

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName || "");
      setPhone(user.phone || "");
      // Note: Address is not yet in the @saas/shared UserResponseDTO provided earlier, 
      // but the UI has a field for it. Keeping it as local state for now.
    }
  }, [user]);

  const updateBusinessMutation = useMutation({
    mutationFn: (data: UpdateBusinessProfileDTO) =>
      api.patch("/profile/business", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Configurações do negócio atualizadas!" });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSaveBusiness = () => {
    updateBusinessMutation.mutate({
      businessName,
      slug: businessName.toLowerCase().trim().replace(/\s+/g, "-"),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as configurações do seu negócio</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business">Negócio</TabsTrigger>
          <TabsTrigger value="availability">Horários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6 space-y-6">
          {/* Business Info */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Informações do Negócio</h3>
                <p className="text-sm text-muted-foreground">Dados exibidos na página de agendamento</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando dados...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do Negócio</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full mt-6"
              onClick={handleSaveBusiness}
              disabled={isLoading || updateBusinessMutation.isPending}
            >
              {updateBusinessMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <AvailabilitySettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Notificações</h3>
                <p className="text-sm text-muted-foreground">Configure como receber alertas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Novos agendamentos</p>
                  <p className="text-sm text-muted-foreground">Receber alerta de novo agendamento</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Cancelamentos</p>
                  <p className="text-sm text-muted-foreground">Receber alerta de cancelamento</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Lembretes</p>
                  <p className="text-sm text-muted-foreground">Enviar lembrete automático ao cliente</p>
                </div>
                <Switch />
              </div>
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => toast({ title: "Em breve", description: "Configurações de notificação pendentes no backend." })}
            >
              Salvar Alterações
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

