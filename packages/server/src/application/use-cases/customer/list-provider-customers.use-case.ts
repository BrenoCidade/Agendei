import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';

interface ListProviderCustomersInput {
  providerId: string;
}

interface CustomerOutput {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
}

export class ListProviderCustomersUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: ListProviderCustomersInput): Promise<CustomerOutput[]> {
    const customers = await this.customerRepository.findByProvider(
      input.providerId,
    );

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    }));
  }
}
