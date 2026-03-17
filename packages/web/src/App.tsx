import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
