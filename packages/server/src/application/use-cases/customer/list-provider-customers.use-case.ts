import { Inject, Injectable } from '@nestjs/common';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';

interface ListProviderCustomersInput {
  providerId: string;
}

interface CustomerOutput {
  id: string;
  name: string;
  email: string;
  phone: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ListProviderCustomersUseCase {
  constructor(
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  async execute(input: ListProviderCustomersInput): Promise<CustomerOutput[]> {
    const customers = await this.customerRepository.findByProvider(
      input.providerId,
    );

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      providerId: customer.providerId,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));
  }
}
