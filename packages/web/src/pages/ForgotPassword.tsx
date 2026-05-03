import { useState } from "react";
import { Link } from "react-router-dom";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      // Por segurança não confirmamos se o e-mail existe ou não
      // Se a API retornar 200 ou 404, tratamos igual (apenas erros de servidor mostramos)
      const message = getApiErrorMessage(err, "");
      if (message) {
        setError(message);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Verifique seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Se <span className="font-medium text-foreground">{email}</span> estiver
                cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Não recebeu? Verifique a pasta de spam ou tente novamente.
            </p>
            <Link
              to="/login"
              className="block text-sm text-primary font-medium hover:underline"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold text-foreground">Esqueci minha senha</h1>
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos um link para você criar uma nova senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Lembrou a senha?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Voltar ao login
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
