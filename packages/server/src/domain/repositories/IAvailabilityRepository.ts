import { Availability } from '../entities/availability';

export interface IAvailabilityRepository {
  save(availability: Availability): Promise<void>;

  findById(id: string): Promise<Availability | null>;

  findByProviderId(providerId: string): Promise<Availability[]>;

  findByProviderIdAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<Availability | null>;

  findActiveByProviderId(providerId: string): Promise<Availability[]>;

  delete(id: string): Promise<void>;
}
