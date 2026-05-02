export interface AppointmentEmailParams {
  customerEmail: string;
  customerName: string;
  providerEmail: string;
  providerName: string;
  serviceName: string;
  startsAt: Date;
  cancelReason?: string;
}

export interface IEmailGateway {
  sendRecoveryEmail(to: string, token: string): Promise<void>;
  sendAppointmentCreatedToCustomer(params: AppointmentEmailParams): Promise<void>;
  sendAppointmentCreatedToProvider(params: AppointmentEmailParams): Promise<void>;
  sendAppointmentCancelledByCustomer(params: AppointmentEmailParams): Promise<void>;
  sendAppointmentCancelledByProvider(params: AppointmentEmailParams): Promise<void>;
}
