import { Injectable } from '@nestjs/common';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Appointment } from '@/domain/entities/appointment';
import { NotFoundError } from '@/domain/errors';
import type { PaginatedResult } from '@/domain/types/pagination';
import { PrismaService } from '../prisma.service';
import { PrismaAppointmentMapper } from '../mappers/prisma-appointment.mapper';

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(appointment: Appointment): Promise<void> {
    const data = PrismaAppointmentMapper.toPrisma(appointment);

    await this.prisma.appointment.upsert({
      where: { id: appointment.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) return null;

    return PrismaAppointmentMapper.toDomain(appointment);
  }

  async findByIdOrFail(id: string): Promise<Appointment> {
    return this.prisma.appointment
      .findUnique({ where: { id } })
      .then((appointment) => {
        if (!appointment) {
          throw new NotFoundError(
            'Appointment not found',
            'APPOINTMENT_NOT_FOUND',
          );
        }
        return PrismaAppointmentMapper.toDomain(appointment);
      });
  }

  async existsByServiceId(serviceId: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { serviceId },
    });
    return count > 0;
  }

  async findByCustomerId(customerId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startsAt: 'desc' },
    });

    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findByProviderAndDateRange(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        providerId,
        startsAt: { gte: startDate, lte: endDate },
      },
      orderBy: { startsAt: 'asc' },
    });
    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findByProviderId(providerId: string): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { providerId },
      orderBy: { startsAt: 'desc' },
    });
    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findFutureByProviderAndDay(
    providerId: string,
    day: number,
  ): Promise<Appointment[]> {
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        providerId,
        startsAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
      orderBy: { startsAt: 'asc' },
    });
    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findOverlapping(
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        providerId,
        status: { not: 'CANCELLED' },
        id: excludeId ? { not: excludeId } : undefined,
        AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
      },
    });

    if (!appointment) return null;

    return PrismaAppointmentMapper.toDomain(appointment);
  }

  async findByProvider(
    providerId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: Array<
        'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
      >;
    },
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        providerId,
        ...(filters?.startDate && { startsAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { startsAt: { lte: filters.endDate } }),
        ...(filters?.status && { status: { in: filters.status } }),
      },
      orderBy: { startsAt: 'desc' },
    });

    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        startsAt: { gte: startDate, lte: endDate },
      },
      orderBy: { startsAt: 'asc' },
    });

    return appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Appointment>> {
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        orderBy: { startsAt: 'desc' },
      }),
      this.prisma.appointment.count(),
    ]);

    const domainAppointments = appointments.map((appointment) =>
      PrismaAppointmentMapper.toDomain(appointment),
    );

    return {
      data: domainAppointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.delete({
      where: { id },
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.appointment.count({
      where: { id },
    });

    return count > 0;
  }

  async countByProvider(
    providerId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: Array<
        'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
      >;
    },
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        providerId,
        ...(filters?.startDate && { startsAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { startsAt: { lte: filters.endDate } }),
        ...(filters?.status && { status: { in: filters.status } }),
      },
    });
  }
}
