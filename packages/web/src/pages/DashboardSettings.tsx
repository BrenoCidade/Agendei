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
import { getReadableTextColor, isValidHexColor } from "@/lib/public-branding";

function normalizeColorInput(value: string) {
  return value.toUpperCase();
}

function ColorField({
  id,
  label,
  value,
  placeholder,
  fallbackColor,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  fallbackColor: string;
  onChange: (value: string) => void;
}) {
  const pickerValue = isValidHexColor(value) ? value : fallbackColor;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative h-10 w-10 shrink-0">
          <input
            id={`${id}-picker`}
            type="color"
            value={pickerValue}
            onChange={(event) => onChange(normalizeColorInput(event.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label={`${label} seletor visual`}
          />
          <button
            type="button"
            className="h-10 w-10 rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: pickerValue }}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(normalizeColorInput(event.target.value))}
          placeholder={placeholder}
          maxLength={7}
        />
      </div>
    </div>
  );
}

export default function DashboardSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setPrimaryColor(user.primaryColor ?? "");
    setSecondaryColor(user.secondaryColor ?? "");
    setAccentColor(user.accentColor ?? "");
    setSaveError(null);
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
      phone !== (user.phone ?? "") ||
      primaryColor !== (user.primaryColor ?? "") ||
      secondaryColor !== (user.secondaryColor ?? "") ||
      accentColor !== (user.accentColor ?? "")
    );
  }, [
    accentColor,
    businessName,
    normalizedSlug,
    phone,
    primaryColor,
    secondaryColor,
    user,
  ]);

  const updateBusinessMutation = useMutation({
    mutationFn: async (payload: UpdateBusinessProfileDTO) => {
      const response = await api.patch<UserResponseDTO>("/profile/business", payload);
      return response.data;
    },
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaveError(null);
      toast({ title: "Configuracoes do negocio atualizadas." });
    },
    onError: (mutationError) => {
      const message = getApiErrorMessage(
        mutationError,
        "Nao foi possivel salvar as configuracoes do negocio.",
      );
      setSaveError(message);
      toast({
        title: message,
        variant: "destructive",
      });
    },
  });

  const handleSaveBusiness = () => {
    const normalizedPrimaryColor = primaryColor.trim().toUpperCase();
    const normalizedSecondaryColor = secondaryColor.trim().toUpperCase();
    const normalizedAccentColor = accentColor.trim().toUpperCase();

    if (!isValidHexColor(normalizedPrimaryColor)) {
      setSaveError("A cor primaria precisa estar em HEX, como #1D4ED8.");
      return;
    }

    if (!isValidHexColor(normalizedSecondaryColor)) {
      setSaveError("A cor secundaria precisa estar em HEX, como #DBEAFE.");
      return;
    }

    if (!isValidHexColor(normalizedAccentColor)) {
      setSaveError("A cor de destaque precisa estar em HEX, como #F97316.");
      return;
    }

    setSaveError(null);
    updateBusinessMutation.mutate({
      businessName: businessName.trim(),
      slug: normalizedSlug,
      phone: phone.trim() || undefined,
      primaryColor: normalizedPrimaryColor,
      secondaryColor: normalizedSecondaryColor,
      accentColor: normalizedAccentColor,
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

                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                  <div>
                    <h4 className="font-medium text-foreground">
                      Cores da pagina publica
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Defina a identidade visual do link de agendamento dos seus clientes.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <ColorField
                        id="primary-color"
                        label="Cor primaria"
                        value={primaryColor}
                        onChange={setPrimaryColor}
                        placeholder="#1D4ED8"
                        fallbackColor="#1D4ED8"
                      />
                    </div>

                    <div className="space-y-2">
                      <ColorField
                        id="secondary-color"
                        label="Cor secundaria"
                        value={secondaryColor}
                        onChange={setSecondaryColor}
                        placeholder="#DBEAFE"
                        fallbackColor="#DBEAFE"
                      />
                    </div>

                    <div className="space-y-2">
                      <ColorField
                        id="accent-color"
                        label="Cor de destaque"
                        value={accentColor}
                        onChange={setAccentColor}
                        placeholder="#F97316"
                        fallbackColor="#F97316"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Previa local
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A aparencia abaixo ajuda a revisar as cores, mas so vale para os clientes
                      depois que voce salvar.
                    </p>
                    <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                        <div>
                          <p className="font-semibold text-foreground">{businessName || "Seu negocio"}</p>
                          <p className="text-sm text-muted-foreground">
                            Como o cliente vai perceber seu tema
                          </p>
                        </div>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: accentColor || "#F97316",
                            color: getReadableTextColor(accentColor || "#F97316"),
                          }}
                        >
                          Aberto
                        </span>
                      </div>
                      <div
                        className="mt-4 rounded-xl p-4"
                        style={{ backgroundColor: secondaryColor || "#DBEAFE" }}
                      >
                        <div
                          className="rounded-xl px-4 py-3 text-sm font-semibold"
                          style={{
                            backgroundColor: primaryColor || "#1D4ED8",
                            color: getReadableTextColor(primaryColor || "#1D4ED8"),
                          }}
                        >
                          Servico selecionado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {saveError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Falha ao salvar o branding</AlertTitle>
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}
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
