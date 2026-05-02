import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

interface SeedProfessionalOptions {
  name?: string;
  emailPrefix?: string;
  businessNamePrefix?: string;
  password?: string;
  phone?: string;
}

export interface SeededProfessional {
  user: {
    id: string;
    email: string;
    slug: string;
    businessName: string;
  };
  service: {
    id: string;
    name: string;
    durationInMinutes: number;
    priceInCents: number;
  };
  plainPassword: string;
}

const sanitizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export async function seedProfessional(
  prisma: PrismaClient,
  options: SeedProfessionalOptions = {},
): Promise<SeededProfessional> {
  const suffix = randomUUID().slice(0, 8);
  const plainPassword = options.password ?? 'Test@1234';

  const emailPrefix = options.emailPrefix ?? 'e2e-professional';
  const businessNamePrefix = options.businessNamePrefix ?? 'E2E Business';
  const businessName = `${businessNamePrefix} ${suffix}`;

  const user = await prisma.user.create({
    data: {
      name: options.name ?? 'E2E Professional',
      email: `${emailPrefix}-${suffix}@test.com`,
      passwordHash: await hash(plainPassword, 8),
      businessName,
      slug: `${sanitizeSlug(businessNamePrefix)}-${suffix}`,
      phone: options.phone ?? '11999999999',
    },
    select: {
      id: true,
      email: true,
      slug: true,
      businessName: true,
    },
  });

  const service = await prisma.service.create({
    data: {
      providerId: user.id,
      name: 'Corte de Cabelo',
      description: 'Servico base para testes E2E',
      durationInMinutes: 30,
      priceInCents: 3000,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      durationInMinutes: true,
      priceInCents: true,
    },
  });

  return {
    user,
    service,
    plainPassword,
  };
}
