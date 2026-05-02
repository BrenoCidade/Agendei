import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { cleanDatabase } from './helpers/cleanup';

describe('Appointments Contract E2E', () => {
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

    const email = generateUniqueEmail('appointments-contract');
    const businessName = `Contract Business ${randomUUID().slice(0, 8)}`;

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

    const service = await prisma.service.create({
      data: {
        name: 'Corte Premium',
        description: 'Corte com acabamento completo',
        durationInMinutes: 45,
        priceInCents: 5500,
        providerId,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        name: 'Carlos Silva',
        email: generateUniqueEmail('customer-contract'),
        phone: '11988887777',
        providerId,
      },
    });

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 1);
    startsAt.setHours(10, 0, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(45);

    await prisma.appointment.create({
      data: {
        startsAt,
        endsAt,
        status: 'PENDING',
        providerId,
        serviceId: service.id,
        customerId: customer.id,
        observation: 'Cliente prefere atendimento rapido',
      },
    });
  });

  it('returns provider-facing appointment summaries with customer and service details', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/appointments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      customerId: expect.any(String),
      serviceId: expect.any(String),
      observation: 'Cliente prefere atendimento rapido',
      customer: {
        id: expect.any(String),
        name: 'Carlos Silva',
        phone: '11988887777',
      },
      service: {
        id: expect.any(String),
        name: 'Corte Premium',
        durationInMinutes: 45,
        priceInCents: 5500,
      },
    });
  });
});
