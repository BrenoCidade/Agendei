import { Injectable } from '@nestjs/common';
import { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import { Service } from '@/domain/entities/service';
import { NotFoundError } from '@/domain/errors';
import { PrismaService } from '../prisma.service';
import { PrismaServiceMapper } from '../mappers/prisma-service.mapper';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(service: Service): Promise<void> {
    const data = PrismaServiceMapper.toPrisma(service);

    await this.prisma.service.upsert({
      where: { id: service.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Service | null> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) return null;

    return PrismaServiceMapper.toDomain(service);
  }

  async findByIdOrFail(id: string): Promise<Service> {
    return this.prisma.service.findUnique({ where: { id } }).then((service) => {
      if (!service) {
        throw new NotFoundError('Service not found', 'SERVICE_NOT_FOUND');
      }
      return PrismaServiceMapper.toDomain(service);
    });
  }

  async findByProviderId(providerId: string): Promise<Service[]> {
    const services = await this.prisma.service.findMany({
      where: { providerId },
      orderBy: { name: 'asc' },
    });

    return services.map((service) => PrismaServiceMapper.toDomain(service));
  }

  async findActiveByProviderId(providerId: string): Promise<Service[]> {
    const services = await this.prisma.service.findMany({
      where: {
        providerId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return services.map((service) => PrismaServiceMapper.toDomain(service));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.delete({
      where: { id },
    });
  }
}
