import { Appointment } from '../entities/appointment';

export interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByIdOrFail(id: string): Promise<Appointment>;
  findByProviderId(providerId: string): Promise<Appointment[]>;
  findByCustomerId(customerId: string): Promise<Appointment[]>;
  findOverlapping(
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment | null>;
  findFutureByProviderAndDay(
    providerId: string,
    day: number,
  ): Promise<Appointment[]>;
  existsByServiceId(serviceId: string): Promise<boolean>;
  findByProviderAndDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>;
}
