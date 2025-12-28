import { CustomerResponseDTO } from '@saas/shared';
import { Customer } from '@/domain/entities/customer';

export class CustomerResponseMapper {
  static toDTO(customer: Customer): CustomerResponseDTO {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      providerId: customer.providerId,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
