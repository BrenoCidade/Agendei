export type NotificationEventType =
  | 'appointment.created'
  | 'appointment.cancelled_by_customer'
  | 'appointment.cancelled_by_provider';

export interface NotificationPayload {
  type: NotificationEventType;
  appointmentId: string;
  customerName: string;
  serviceName: string;
  startsAt: Date;
  cancelReason?: string;
}

export interface INotificationGateway {
  notifyProvider(providerId: string, payload: NotificationPayload): void;
}
