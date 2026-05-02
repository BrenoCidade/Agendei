import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import type { Server } from 'http';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { cleanDatabase } from './helpers/cleanup';
import { seedProfessional } from './helpers/seed';

interface AuthSession {
  token: string;
  userId: string;
  email: string;
}

describe('Regression E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const registerAndLogin = async (prefix: string): Promise<AuthSession> => {
    const email = `${prefix}-${randomUUID()}@test.com`;

    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        name: `User ${prefix}`,
        email,
        password: 'Test@1234',
        businessName: `Business ${prefix} ${randomUUID().slice(0, 8)}`,
        phone: '11999999999',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email,
        password: 'Test@1234',
      })
      .expect(200);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User must exist after registerAndLogin');
    }

    return {
      token: (loginResponse.body as { access_token: string }).access_token,
      userId: user.id,
      email,
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('seedProfessional should create reusable provider and base service', async () => {
    const seeded = await seedProfessional(prisma);

    expect(seeded.user.id).toBeDefined();
    expect(seeded.user.email).toContain('@test.com');
    expect(seeded.user.slug).toBeTruthy();

    expect(seeded.service.id).toBeDefined();
    expect(seeded.service.durationInMinutes).toBe(30);
    expect(seeded.service.priceInCents).toBe(3000);

    const serviceInDb = await prisma.service.findUnique({
      where: { id: seeded.service.id },
      select: { providerId: true },
    });

    expect(serviceInDb?.providerId).toBe(seeded.user.id);
  });

  it('should return 409 when trying to schedule an already booked slot', async () => {
    const seeded = await seedProfessional(prisma);

    const customer = await prisma.customer.create({
      data: {
        name: 'Cliente Inicial',
        email: `cliente-inicial-${randomUUID()}@test.com`,
        phone: '11988888888',
        providerId: seeded.user.id,
      },
    });

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 2);
    startsAt.setHours(10, 0, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + 30);

    await prisma.appointment.create({
      data: {
        startsAt,
        endsAt,
        status: 'PENDING',
        customerId: customer.id,
        serviceId: seeded.service.id,
        providerId: seeded.user.id,
      },
    });

    await request(app.getHttpServer() as Server)
      .post(`/public/${seeded.user.slug}/schedule`)
      .send({
        customerName: 'Cliente Conflito',
        customerEmail: `cliente-conflito-${randomUUID()}@test.com`,
        customerPhone: '11977777777',
        serviceId: seeded.service.id,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      })
      .expect(409);
  });

  it('should return 403 when confirming an appointment from another provider', async () => {
    const owner = await registerAndLogin('owner');
    const intruder = await registerAndLogin('intruder');

    const ownerService = await prisma.service.create({
      data: {
        providerId: owner.userId,
        name: 'Corte do Owner',
        durationInMinutes: 30,
        priceInCents: 3500,
      },
      select: { id: true },
    });

    const ownerCustomer = await prisma.customer.create({
      data: {
        providerId: owner.userId,
        name: 'Cliente Owner',
        email: `cliente-owner-${randomUUID()}@test.com`,
        phone: '11966666666',
      },
      select: { id: true },
    });

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(15, 0, 0, 0);

    const appointment = await prisma.appointment.create({
      data: {
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60 * 1000),
        status: 'PENDING',
        customerId: ownerCustomer.id,
        serviceId: ownerService.id,
        providerId: owner.userId,
      },
      select: { id: true },
    });

    await request(app.getHttpServer() as Server)
      .patch(`/appointments/${appointment.id}/confirm`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .expect(403);
  });
});
