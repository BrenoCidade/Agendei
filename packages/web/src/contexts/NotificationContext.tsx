import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPayload {
  type: 'appointment.created' | 'appointment.cancelled_by_customer' | 'appointment.cancelled_by_provider';
  appointmentId: string;
  customerName: string;
  serviceName: string;
  startsAt: string;
  cancelReason?: string;
}

const NotificationContext = createContext<null>(null);

function getSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return 'http://localhost:3333';
}

function formatDate(iso: string): string {
  return format(new Date(iso), "dd/MM 'às' HH:mm", { locale: ptBR });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(getSocketUrl(), {
      namespace: '/notifications',
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });

    socket.on('appointment.created', (payload: NotificationPayload) => {
      const date = formatDate(payload.startsAt);
      toast.success('Novo agendamento', {
        description: `${payload.customerName} agendou ${payload.serviceName} para ${date}`,
        duration: 8000,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    });

    socket.on('appointment.cancelled_by_customer', (payload: NotificationPayload) => {
      const date = formatDate(payload.startsAt);
      toast.warning('Agendamento cancelado', {
        description: `${payload.customerName} cancelou ${payload.serviceName} de ${date}`,
        duration: 10000,
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);

  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
