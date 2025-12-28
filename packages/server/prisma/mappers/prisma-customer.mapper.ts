import { Customer } from '@/domain/entities/customer';
import { Customer as PrismaCustomer } from '@prisma/client';

export class PrismaCustomerMapper {
  /**
   * 📥 Prisma → Domain
   */
  static toDomain(raw: PrismaCustomer): Customer {
    return new Customer({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      providerId: raw.providerId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * 📤 Domain → Prisma
   */
  static toPrisma(
    customer: Customer,
  ): Omit<PrismaCustomer, 'createdAt' | 'updatedAt'> {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      providerId: customer.providerId,
    };
  }
}
