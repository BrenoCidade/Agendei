import { Service } from '../../src/domain/entities/service';
import { IServiceRepository } from '../../src/domain/repositories/IServiceRepository';

export class InMemoryServiceRepository implements IServiceRepository {
  public services: Service[] = [];

  save(service: Service): Promise<void> {
    const existingIndex = this.services.findIndex((s) => s.id === service.id);

    if (existingIndex >= 0) {
      this.services[existingIndex] = service;
    } else {
      this.services.push(service);
    }

    return Promise.resolve();
  }

  findById(id: string): Promise<Service | null> {
    const service = this.services.find((s) => s.id === id);
    return Promise.resolve(service ?? null);
  }

  findByProviderId(providerId: string): Promise<Service[]> {
    return Promise.resolve(
      this.services.filter((s) => s.providerId === providerId),
    );
  }

  findActiveByProviderId(providerId: string): Promise<Service[]> {
    return Promise.resolve(
      this.services.filter(
        (s) => s.providerId === providerId && s.isActive === true,
      ),
    );
  }

  delete(id: string): Promise<void> {
    this.services = this.services.filter((s) => s.id !== id);
    return Promise.resolve();
  }
}
