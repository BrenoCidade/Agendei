import { AppointmentResponse } from '@saas/shared';
import { Appointment } from '@/domain/entities/appointment';

export class AppointmentResponseMapper {
  static toDTO(
    appointment: Appointment,
    details?: {
      customer?: {
        id: string;
        name: string;
        phone: string | null;
      };
      service?: {
        id: string;
        name: string;
        durationInMinutes: number;
        priceInCents: number;
      };
    },
  ): AppointmentResponse {
    return {
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      observation: appointment.observation ?? null,
      canceledAt: appointment.canceledAt?.toISOString() ?? null,
      cancelReason: appointment.cancelReason ?? null,
      canceledBy: appointment.canceledBy ?? null,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      providerId: appointment.providerId,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      customer: details?.customer,
      service: details?.service,
    };
  }

  static toDTOList(appointments: Appointment[]): AppointmentResponse[] {
    return appointments.map((appointment) => this.toDTO(appointment));
  }
}
