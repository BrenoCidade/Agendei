import { Injectable } from '@nestjs/common';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import { Customer } from '@/domain/entities/customer';
import { NotFoundError } from '@/domain/errors';
import type { PaginatedResult } from '@/domain/types/pagination';
import { PrismaService } from '../prisma.service';
import { PrismaCustomerMapper } from '../mappers/prisma-customer.mapper';

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(customer: Customer): Promise<void> {
    const data = PrismaCustomerMapper.toPrisma(customer);

    await this.prisma.customer.upsert({
      where: { id: customer.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) return null;

    return PrismaCustomerMapper.toDomain(customer);
  }

  async findByEmailAndProvider(
    email: string,
    providerId: string,
  ): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        email,
        providerId,
      },
    });

    if (!customer) return null;

    return PrismaCustomerMapper.toDomain(customer);
  }

  async findByPhoneAndProvider(
    phone: string,
    providerId: string,
  ): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        phone,
        providerId,
      },
    });

    if (!customer) return null;

    return PrismaCustomerMapper.toDomain(customer);
  }

  async findByProvider(providerId: string): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: { providerId },
      orderBy: { name: 'asc' },
    });

    return customers.map((customer) => PrismaCustomerMapper.toDomain(customer));
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Customer>> {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    const domainCustomers = customers.map((customer) =>
      PrismaCustomerMapper.toDomain(customer),
    );

    return {
      data: domainCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({
      where: { id },
    });
  }

  async findByIdOrFail(id: string): Promise<Customer> {
    return this.prisma.customer
      .findUnique({ where: { id } })
      .then((customer) => {
        if (!customer) {
          throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND');
        }
        return PrismaCustomerMapper.toDomain(customer);
      });
  }
}
