import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateBusinessProfileDTO, UpdateProfileDTO, UserResponseDTO } from "@saas/shared";
import { AlertCircle, Camera, Check, Copy, KeyRound, Loader2, RefreshCcw, Store, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={() => void handleCopy()}
      title="Copiar link"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
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

  // ---- Meu Perfil state ----
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ---- Trocar senha state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

    // Sync profile tab
    setProfileName(user.name);
    setProfileEmail(user.email);
    setProfilePhone(user.phone ?? "");
    setProfileError(null);
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

  // ---- Mutations: Meu Perfil ----
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfileDTO) => {
      const response = await api.patch<UserResponseDTO>("/profile/", payload);
      return response.data;
    },
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setProfileError(null);
      toast({ title: "Dados pessoais atualizados." });
    },
    onError: (mutationError) => {
      const message = getApiErrorMessage(mutationError, "Nao foi possivel salvar os dados.");
      setProfileError(message);
      toast({ title: message, variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await api.patch("/profile/password", payload);
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      toast({ title: "Senha alterada com sucesso." });
    },
    onError: (mutationError) => {
      const message = getApiErrorMessage(mutationError, "Nao foi possivel alterar a senha.");
      setPasswordError(message);
      toast({ title: message, variant: "destructive" });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await api.post<UserResponseDTO>("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: async (updatedUser) => {
      queryClient.setQueryData(["profile"], updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Foto de perfil atualizada." });
    },
    onError: (mutationError) => {
      toast({
        title: getApiErrorMessage(mutationError, "Nao foi possivel enviar a foto."),
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatarMutation.mutate(file);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError("Nome e e-mail sao obrigatorios.");
      return;
    }
    setProfileError(null);
    updateProfileMutation.mutate({
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim() || undefined,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Preencha todos os campos de senha.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A nova senha e a confirmacao nao coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("A nova senha precisa ter ao menos 8 caracteres.");
      return;
    }
    setPasswordError(null);
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configuracoes</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os dados reais do seu negocio
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
          <TabsTrigger value="availability">Horarios</TabsTrigger>
        </TabsList>

        {/* ---- Aba: Meu Perfil ---- */}
        <TabsContent value="profile" className="mt-6 space-y-6">

          {/* Avatar upload */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                  <AvatarImage src={avatarPreview ?? user?.avatarUrl ?? undefined} alt={user?.name} />
                  <AvatarFallback className="bg-primary-light text-primary text-2xl font-semibold">
                    {user?.name?.substring(0, 2).toUpperCase() ?? "US"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="font-medium text-foreground">{user?.name ?? "Seu nome"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="mt-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {uploadAvatarMutation.isPending ? "Enviando..." : "Alterar foto"}
                </button>
              </div>
            </div>
          </Card>

          {/* Dados pessoais */}
          <Card className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Dados pessoais</h3>
                <p className="text-sm text-muted-foreground">
                  Nome, e-mail e telefone da sua conta
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando perfil...</span>
              </div>
            ) : isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nao foi possivel carregar seu perfil</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p>{getApiErrorMessage(error, "Tente novamente em instantes.")}</p>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => void refetch()}>
                    <RefreshCcw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nome</Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">E-mail</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Telefone</Label>
                  <Input
                    id="profile-phone"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="11999999999"
                  />
                </div>

                {profileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              className="mt-4 sm:mt-6 w-full"
              onClick={handleSaveProfile}
              disabled={isLoading || isError || updateProfileMutation.isPending || !profileName.trim() || !profileEmail.trim()}
            >
              {updateProfileMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : "Salvar dados pessoais"}
            </Button>
          </Card>

          {/* Alterar senha */}
          <Card className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Alterar senha</h3>
                <p className="text-sm text-muted-foreground">
                  Troque sua senha de acesso ao painel
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Minimo 8 caracteres com maiuscula, minuscula, numero e simbolo.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              className="mt-4 sm:mt-6 w-full"
              variant="outline"
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            >
              {changePasswordMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</>
              ) : "Alterar senha"}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6 space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6 flex items-center gap-3">
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
                  <Label htmlFor="business-slug">Link de agendamento</Label>
                  <Input
                    id="business-slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="meu-negocio"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use apenas letras, numeros e hifens. Sem espacos.
                  </p>

                  {/* Live URL preview */}
                  {normalizedSlug && (
                    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Seu link para compartilhar com clientes
                      </p>
                      <div className="flex items-center gap-2 justify-between">
                        <a
                          href={`${window.location.origin}/${normalizedSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary underline-offset-2 hover:underline break-all"
                        >
                          {window.location.origin}/{normalizedSlug}
                        </a>
                        <div className="shrink-0">
                          <CopyLinkButton slug={normalizedSlug} />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Envie este link para seus clientes agendarem diretamente com voce.
                      </p>
                    </div>
                  )}
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

                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
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

                  <div className="rounded-xl border border-dashed border-border bg-background p-3 sm:p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Previa local
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      A aparencia abaixo ajuda a revisar as cores, mas so vale para os clientes
                      depois que voce salvar.
                    </p>
                    <div className="mt-3 sm:mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 sm:px-4 sm:py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{businessName || "Seu negocio"}</p>
                          <p className="text-sm text-muted-foreground">
                            Como o cliente vai perceber seu tema
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: accentColor || "#F97316",
                            color: getReadableTextColor(accentColor || "#F97316"),
                          }}
                        >
                          Aberto
                        </span>
                      </div>
                      <div
                        className="mt-3 sm:mt-4 rounded-xl p-3 sm:p-4"
                        style={{ backgroundColor: secondaryColor || "#DBEAFE" }}
                      >
                        <div
                          className="rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold"
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
              className="mt-4 sm:mt-6 w-full"
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
