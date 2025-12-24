import { Appointment } from '../entities/appointment';

export interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByProviderId(providerId: string): Promise<Appointment[]>;
  findByCustomerId(customerId: string): Promise<Appointment[]>;
  findOverlapping(
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment | null>;
}
