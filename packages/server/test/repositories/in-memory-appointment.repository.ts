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

  findByProviderId(providerId: string): Promise<Appointment[]> {
    return Promise.resolve(
      this.appointments.filter((a) => a.providerId === providerId),
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
