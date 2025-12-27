import { Customer } from '../../src/domain/entities/customer';
import { ICustomerRepository } from '../../src/domain/repositories/ICustomerRepository';

export class InMemoryCustomerRepository implements ICustomerRepository {
  public customers: Customer[] = [];

  save(customer: Customer): Promise<void> {
    const existingIndex = this.customers.findIndex((c) => c.id === customer.id);

    if (existingIndex >= 0) {
      this.customers[existingIndex] = customer;
    } else {
      this.customers.push(customer);
    }

    return Promise.resolve();
  }

  findById(id: string): Promise<Customer | null> {
    const customer = this.customers.find((c) => c.id === id);
    return Promise.resolve(customer ?? null);
  }

  findByIdOrFail(id: string): Promise<Customer> {
    const customer = this.customers.find((c) => c.id === id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return Promise.resolve(customer);
  }

  findByEmailAndProvider(
    email: string,
    providerId: string,
  ): Promise<Customer | null> {
    const customer = this.customers.find(
      (c) => c.email === email && c.providerId === providerId,
    );
    return Promise.resolve(customer ?? null);
  }

  findByPhoneAndProvider(
    phone: string,
    providerId: string,
  ): Promise<Customer | null> {
    const customer = this.customers.find(
      (c) => c.phone === phone && c.providerId === providerId,
    );
    return Promise.resolve(customer ?? null);
  }

  findByProvider(providerId: string): Promise<Customer[]> {
    return Promise.resolve(
      this.customers.filter((c) => c.providerId === providerId),
    );
  }
}
