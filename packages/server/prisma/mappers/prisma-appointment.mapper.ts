import { Appointment } from '@/domain/entities/appointment';
import { Appointment as PrismaAppointment } from '@prisma/client';

export class PrismaAppointmentMapper {
  static toDomain(raw: PrismaAppointment): Appointment {
    return new Appointment({
      id: raw.id,
      customerId: raw.customerId,
      serviceId: raw.serviceId,
      providerId: raw.providerId,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      status: raw.status,
      observation: raw.observation ?? undefined,
      cancelReason: raw.cancelReason,
      canceledBy: raw.canceledBy,
      canceledAt: raw.canceledAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(
    appointment: Appointment,
  ): Omit<PrismaAppointment, 'createdAt' | 'updatedAt'> {
    return {
      id: appointment.id,
      customerId: appointment.customerId,
      serviceId: appointment.serviceId,
      providerId: appointment.providerId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      observation: appointment.observation ?? null,
      cancelReason: appointment.cancelReason,
      canceledBy: appointment.canceledBy,
      canceledAt: appointment.canceledAt,
    };
  }
}
