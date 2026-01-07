import { User } from '@/domain/entities/user';
import { User as PrismaUser } from '@prisma/client';

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      phone: raw.phone ?? undefined,
      businessName: raw.businessName,
      slug: raw.slug,
      passwordHash: raw.passwordHash,
      passwordResetToken: raw.passwordResetToken ?? null,
      passwordResetExpires: raw.passwordResetTokenExpiresAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      phone: user.phone,
      businessName: user.businessName,
      slug: user.slug,
      passwordResetToken: user.passwordResetToken,
      passwordResetTokenExpiresAt: user.passwordResetExpires,
    };
  }
}
