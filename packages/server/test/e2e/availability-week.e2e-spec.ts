import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { cleanDatabase } from './helpers/cleanup';

describe('Availability Week E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let providerId: string;

  const generateUniqueEmail = (prefix: string) =>
    `${prefix}-${randomUUID()}@test.com`;

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

    const email = generateUniqueEmail('availability-week');
    const businessName = `Week Business ${randomUUID().slice(0, 8)}`;

    await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        name: 'Provider Test',
        email,
        password: 'Test@1234',
        businessName,
        phone: '11999999999',
      });

    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email,
        password: 'Test@1234',
      })
      .expect(200);

    authToken = loginResponse.body.access_token as string;

    const provider = await prisma.user.findUnique({
      where: { email },
    });

    if (!provider) {
      throw new Error('Provider not created');
    }

    providerId = provider.id;

    await prisma.availability.createMany({
      data: [
        {
          providerId,
          dayOfWeek: 1,
          slots: [{ start: '08:00', end: '12:00' }],
          isActive: true,
        },
        {
          providerId,
          dayOfWeek: 3,
          slots: [{ start: '14:00', end: '18:00' }],
          isActive: true,
        },
      ],
    });
  });

  it('replaces weekly availability in a single request', async () => {
    const response = await request(app.getHttpServer() as Server)
      .put('/availability/week')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        availabilities: [
          {
            dayOfWeek: 2,
            slots: [{ start: '09:00', end: '12:00' }],
          },
          {
            dayOfWeek: 5,
            slots: [
              { start: '13:00', end: '16:00' },
              { start: '17:00', end: '19:00' },
            ],
          },
        ],
      })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(
      response.body.map((item: { dayOfWeek: number }) => item.dayOfWeek),
    ).toEqual([2, 5]);

    const availabilitiesInDb = await prisma.availability.findMany({
      where: { providerId },
      orderBy: { dayOfWeek: 'asc' },
    });

    expect(availabilitiesInDb).toHaveLength(2);
    expect(availabilitiesInDb.map((item) => item.dayOfWeek)).toEqual([2, 5]);
  });

  it('blocks closing a day that still has future appointments', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Cliente Imprevisto',
        email: `cliente-${randomUUID()}@test.com`,
        phone: '11988887777',
        providerId,
      },
    });

    const service = await prisma.service.create({
      data: {
        name: 'Consulta de Segunda',
        description: 'Servico para validar bloqueio de fechamento',
        durationInMinutes: 60,
        priceInCents: 9000,
        providerId,
        isActive: true,
      },
    });

    const nextMonday = new Date();
    nextMonday.setDate(
      nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7),
    );
    nextMonday.setHours(9, 0, 0, 0);

    const endsAt = new Date(nextMonday);
    endsAt.setHours(10, 0, 0, 0);

    await prisma.appointment.create({
      data: {
        providerId,
        customerId: customer.id,
        serviceId: service.id,
        startsAt: nextMonday,
        endsAt,
        status: 'CONFIRMED',
      },
    });

    const response = await request(app.getHttpServer() as Server)
      .put('/availability/week')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        availabilities: [
          {
            dayOfWeek: 3,
            slots: [{ start: '14:00', end: '18:00' }],
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toBe(
      'Cannot remove availability for days with future appointments',
    );

    const availabilitiesInDb = await prisma.availability.findMany({
      where: { providerId },
      orderBy: { dayOfWeek: 'asc' },
    });

    expect(availabilitiesInDb.map((item) => item.dayOfWeek)).toEqual([1, 3]);
  });
});
