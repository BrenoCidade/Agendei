import { Appointment } from '../../src/domain/entities/appointment';
import { IAppointmentRepository } from '../../src/domain/repositories/IAppointmentRepository';

export class InMemoryAppointmentRepository implements IAppointmentRepository {
  public appointments: Appointment[] = [];

  save(appointment: Appointment): Promise<void> {
    const existingIndex = this.appointments.findIndex(
      (a) => a.id === appointment.id,
    );

    if (existingIndex >= 0) {
      this.appointments[existingIndex] = appointment;
    } else {
      this.appointments.push(appointment);
    }

    return Promise.resolve();
  }

  findById(id: string): Promise<Appointment | null> {
    const appointment = this.appointments.find((a) => a.id === id);
    return Promise.resolve(appointment ?? null);
  }

  findByIdOrFail(id: string): Promise<Appointment> {
    const appointment = this.appointments.find((a) => a.id === id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }
    return Promise.resolve(appointment);
  }

  findByProviderId(providerId: string): Promise<Appointment[]> {
    return Promise.resolve(
      this.appointments.filter((a) => a.providerId === providerId),
    );
  }

  findByProviderAndDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    return Promise.resolve(
      this.appointments.filter(
        (a) =>
          a.providerId === providerId &&
          a.startsAt >= startDate &&
          a.endsAt <= endDate,
      ),
    );
  }

  findFutureByProviderAndDay(
    providerId: string,
    day: number,
  ): Promise<Appointment[]> {
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);
    return Promise.resolve(
      this.appointments.filter(
        (a) =>
          a.providerId === providerId &&
          a.startsAt >= startOfDay &&
          a.startsAt <= endOfDay &&
          a.status !== 'CANCELLED',
      ),
    );
  }

  existsByServiceId(serviceId: string): Promise<boolean> {
    return Promise.resolve(
      this.appointments.some((a) => a.serviceId === serviceId),
    );
  }

  findByCustomerId(customerId: string): Promise<Appointment[]> {
    return Promise.resolve(
      this.appointments.filter((a) => a.customerId === customerId),
    );
  }

  findOverlapping(
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment | null> {
    const overlapping = this.appointments.find((a) => {
      if (a.id === excludeId) return false;
      if (a.providerId !== providerId) return false;
      if (a.status === 'CANCELLED') return false;

      const hasOverlap =
        (startsAt >= a.startsAt && startsAt < a.endsAt) ||
        (endsAt > a.startsAt && endsAt <= a.endsAt) ||
        (startsAt <= a.startsAt && endsAt >= a.endsAt);

      return hasOverlap;
    });

    return Promise.resolve(overlapping ?? null);
  }
}
