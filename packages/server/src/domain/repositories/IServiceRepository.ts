import { Service } from '../entities/service';

export interface IServiceRepository {
  save(service: Service): Promise<void>;
  findById(id: string): Promise<Service | null>;
  findByIdOrFail(id: string): Promise<Service>;
  findByProviderId(providerId: string): Promise<Service[]>;
  findActiveByProviderId(providerId: string): Promise<Service[]>;
  delete(id: string): Promise<void>;
}
