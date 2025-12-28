import { User } from '@/domain/entities/user';
import { NotFoundError } from '@/domain/errors';
import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { PaginatedResult } from '@/domain/types/pagination';
import { Injectable } from '@nestjs/common';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user);

    await this.prisma.user.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLocaleLowerCase() },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findBySlug(slug: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { slug },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { slug: slug.toLocaleLowerCase() },
    });

    return count > 0;
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<User>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);

    const skip = (safePage - 1) * safeLimit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const domainUsers = users.map((user) => PrismaUserMapper.toDomain(user));

    return {
      data: domainUsers,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}
