import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";
import { PrivateRoute } from "@/components/PrivateRoute";
import { getPublicProviderSlug } from "@/lib/public-provider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import DashboardWrapper from "./pages/DashboardWrapper";
import Dashboard from "./pages/Dashboard";
import DashboardServices from "./pages/DashboardServices";
import DashboardClients from "./pages/DashboardClients";
import DashboardSettings from "./pages/DashboardSettings";
import ClientAppointments from "./pages/ClientAppointments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const PublicEntry = () => {
  const location = useLocation();
  const slug = getPublicProviderSlug(location.search);

  if (slug) {
    return <Navigate to={`/${slug}`} replace />;
  }

  return <Index />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicEntry />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/meus-agendamentos" element={<ClientAppointments />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <DashboardWrapper />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="services" element={<DashboardServices />} />
                <Route path="clients" element={<DashboardClients />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>

              <Route path="/:slug" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </QueryClientProvider>
);

export default App;
