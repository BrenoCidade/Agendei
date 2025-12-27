import { Customer } from '@/domain/entities/customer';
import { NotFoundError } from '@/domain/errors';
import { UnauthorizedError } from '@/domain/errors/unauthorized-error';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';

interface UpdateCustomerInput {
  customerId: string;
  providerId: string;
  name: string;
  email: string;
  phone: string;
}

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<Customer> {
    const customer = await this.customerRepository.findById(input.customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
    }

    if (customer.providerId !== input.providerId) {
      throw new UnauthorizedError(
        'You do not have permission to update this customer',
        'CUSTOMER_UPDATE_FORBIDDEN',
      );
    }

    customer.updateContactInfo(input.name, input.email, input.phone);

    await this.customerRepository.save(customer);

    return customer;
  }
}
