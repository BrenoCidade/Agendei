import { AppointmentResponse } from '@saas/shared';
import { Appointment } from '@/domain/entities/appointment';

export class AppointmentResponseMapper {
  static toDTO(appointment: Appointment): AppointmentResponse {
    return {
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      canceledAt: appointment.canceledAt?.toISOString() ?? null,
      cancelReason: appointment.cancelReason ?? null,
      canceledBy: appointment.canceledBy ?? null,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      providerId: appointment.providerId,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };
  }

  static toDTOList(appointments: Appointment[]): AppointmentResponse[] {
    return appointments.map((appointment) => this.toDTO(appointment));
  }
}
