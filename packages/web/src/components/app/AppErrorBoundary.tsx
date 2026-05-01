import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <Card className="w-full max-w-lg p-8 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Algo saiu do esperado
              </h1>
              <p className="text-sm text-muted-foreground">
                A tela encontrou um erro inesperado. Voce pode recarregar e tentar novamente.
              </p>
            </div>
            <Button onClick={this.handleReload} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              Recarregar aplicacao
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
