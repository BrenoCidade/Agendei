import { Customer } from '../entities/customer';

export interface ICustomerRepository {
  save(customer: Customer): Promise<void>;
  findById(id: string): Promise<Customer | null>;
  findByEmailAndProvider(
    email: string,
    providerId: string,
  ): Promise<Customer | null>;
  findByPhoneAndProvider(
    phone: string,
    providerId: string,
  ): Promise<Customer | null>;
  findByProvider(providerId: string): Promise<Customer[]>;
}
