import { Injectable } from '@nestjs/common';
import { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import { Availability } from '@/domain/entities/availability';
import { PrismaService } from '../prisma.service';
import { PrismaAvailabilityMapper } from '../mappers/prisma-availability.mapper';

@Injectable()
export class PrismaAvailabilityRepository implements IAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(availability: Availability): Promise<void> {
    const data = PrismaAvailabilityMapper.toPrisma(availability);

    await this.prisma.availability.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Availability | null> {
    const availability = await this.prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) return null;

    return PrismaAvailabilityMapper.toDomain(availability);
  }

  async findByProviderIdAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<Availability | null> {
    const availability = await this.prisma.availability.findFirst({
      where: {
        providerId,
        dayOfWeek,
      },
    });

    if (!availability) return null;

    return PrismaAvailabilityMapper.toDomain(availability);
  }

  async findByProviderId(providerId: string): Promise<Availability[]> {
    const availabilities = await this.prisma.availability.findMany({
      where: { providerId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availabilities.map((availability) =>
      PrismaAvailabilityMapper.toDomain(availability),
    );
  }

  async findActiveByProviderId(providerId: string): Promise<Availability[]> {
    const availabilities = await this.prisma.availability.findMany({
      where: { providerId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availabilities.map((availability) =>
      PrismaAvailabilityMapper.toDomain(availability),
    );
  }

  async findAll(): Promise<Availability[]> {
    const availabilities = await this.prisma.availability.findMany({
      orderBy: [{ providerId: 'asc' }, { dayOfWeek: 'asc' }],
    });

    return availabilities.map((availability) =>
      PrismaAvailabilityMapper.toDomain(availability),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.availability.delete({
      where: { id },
    });
  }

  async deleteByProviderAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<void> {
    await this.prisma.availability.deleteMany({
      where: { providerId, dayOfWeek },
    });
  }

  async existsByProviderAndDay(
    providerId: string,
    dayOfWeek: number,
  ): Promise<boolean> {
    const count = await this.prisma.availability.count({
      where: {
        providerId,
        dayOfWeek,
      },
    });

    return count > 0;
  }

  async countByProvider(providerId: string): Promise<number> {
    return this.prisma.availability.count({
      where: { providerId },
    });
  }
}
