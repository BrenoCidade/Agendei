import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateBusinessProfileDTO, UserResponseDTO } from "@saas/shared";
import { AlertCircle, Loader2, RefreshCcw, Store } from "lucide-react";
import { AvailabilitySettings } from "@/components/dashboard/AvailabilitySettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

export default function DashboardSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get<UserResponseDTO>("/profile/me");
      return response.data;
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setBusinessName(user.businessName);
    setSlug(user.slug);
    setPhone(user.phone ?? "");
  }, [user]);

  const normalizedSlug = useMemo(
    () =>
      slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    [slug],
  );

  const isDirty = useMemo(() => {
    if (!user) {
      return false;
    }

    return (
      businessName !== user.businessName ||
      normalizedSlug !== user.slug ||
      phone !== (user.phone ?? "")
    );
  }, [businessName, normalizedSlug, phone, user]);

  const updateBusinessMutation = useMutation({
    mutationFn: async (payload: UpdateBusinessProfileDTO) => {
      const response = await api.patch<UserResponseDTO>("/profile/business", payload);
      return response.data;
    },
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Configuracoes do negocio atualizadas." });
    },
    onError: (mutationError) => {
      toast({
        title: getApiErrorMessage(
          mutationError,
          "Nao foi possivel salvar as configuracoes do negocio.",
        ),
        variant: "destructive",
      });
    },
  });

  const handleSaveBusiness = () => {
    updateBusinessMutation.mutate({
      businessName: businessName.trim(),
      slug: normalizedSlug,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configuracoes</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os dados reais do seu negocio
        </p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="availability">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6 space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Informacoes do negocio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Dados exibidos na sua pagina publica
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando configuracoes...</span>
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nao foi possivel carregar seu perfil</AlertTitle>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nome do negocio</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-slug">Slug publico</Label>
                  <Input
                    id="business-slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado na URL publica do seu negocio.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-phone">Telefone</Label>
                  <Input
                    id="business-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="11999999999"
                  />
                </div>
              </div>
            )}

            <Button
              className="mt-6 w-full"
              onClick={handleSaveBusiness}
              disabled={
                isLoading ||
                isError ||
                updateBusinessMutation.isPending ||
                !businessName.trim() ||
                !normalizedSlug ||
                !isDirty
              }
            >
              {updateBusinessMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alteracoes"
              )}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <AvailabilitySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
