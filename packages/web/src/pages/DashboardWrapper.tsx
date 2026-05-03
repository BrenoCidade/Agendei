import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const pageTitles: Record<string, string> = {
  "/dashboard": "Agenda de Hoje",
  "/dashboard/appointments": "Todos os Agendamentos",
  "/dashboard/services": "Meus Serviços",
  "/dashboard/clients": "Clientes",
  "/dashboard/settings": "Configurações",
};

export default function DashboardWrapper() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Dashboard";

  return <DashboardLayout title={title} />;
}
