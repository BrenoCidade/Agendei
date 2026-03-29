import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading, bootstrapError, refreshProfile, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (bootstrapError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-lg">
          <AlertTitle>Falha ao restaurar sua sessao</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{bootstrapError}</p>
            <div className="flex gap-3">
              <Button onClick={() => void refreshProfile()}>
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={logout}>
                Sair
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
