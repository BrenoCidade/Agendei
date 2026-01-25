import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Public E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let providerId: string;
  let providerSlug: string;
  let serviceId: string;

  const generateUniqueEmail = (prefix: string) =>
    `${prefix}-${randomUUID()}@test.com`;
  const generateUniqueSlug = (prefix: string) =>
    `${prefix}-${randomUUID().substring(0, 8)}`;

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
    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.user.deleteMany();

    const uniqueEmail = generateUniqueEmail('joao');
    const uniqueSlug = generateUniqueSlug('barbearia-do-joao');

    const provider = await prisma.user.create({
      data: {
        name: 'João Barbeiro',
        email: uniqueEmail,
        passwordHash: 'hash123',
        businessName: 'Barbearia do João',
        slug: uniqueSlug,
        phone: '11999999999',
      },
    });

    if (!provider) {
      throw new Error('Provider not created in beforeEach');
    }

    providerId = provider.id;
    providerSlug = provider.slug;

    const service = await prisma.service.create({
      data: {
        name: 'Corte de Cabelo',
        description: 'Corte masculino tradicional',
        durationInMinutes: 30,
        priceInCents: 3000,
        providerId: providerId,
        isActive: true,
      },
    });
    serviceId = service.id;

    const defaultSlots = [{ start: '09:00', end: '18:00' }];

    await prisma.availability.createMany({
      data: [
        {
          dayOfWeek: 1,
          slots: defaultSlots,
          providerId: providerId,
        },
        {
          dayOfWeek: 2,
          slots: defaultSlots,
          providerId: providerId,
        },
        {
          dayOfWeek: 3,
          slots: defaultSlots,
          providerId: providerId,
        },
        {
          dayOfWeek: 4,
          slots: defaultSlots,
          providerId: providerId,
        },
        {
          dayOfWeek: 5,
          slots: defaultSlots,
          providerId: providerId,
        },
      ],
    });
  });

  describe('GET /public/:slug', () => {
    it('should return provider profile with services', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('slug', providerSlug);
      expect(response.body).toHaveProperty('businessName', 'Barbearia do João');
      expect(response.body).toHaveProperty('name', 'João Barbeiro');
      expect(response.body).toHaveProperty('services');

      const body = response.body as {
        slug: string;
        businessName: string;
        name: string;
        services: Array<{ name: string }>;
      };
      expect(Array.isArray(body.services)).toBe(true);
      expect(body.services).toHaveLength(1);
      expect(body.services[0]).toHaveProperty('name', 'Corte de Cabelo');
    });

    it('should return 404 when slug does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/public/non-existent-slug')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should not require authentication', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /public/:slug/slots', () => {
    it('should return available time slots for a service', async () => {
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
      const dateStr = nextMonday.toISOString().split('T')[0];

      const response = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}/slots`)
        .query({
          date: dateStr,
          serviceId: serviceId,
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('slots');

      const body = response.body as {
        slots: string[];
      };
      expect(Array.isArray(body.slots)).toBe(true);
      expect(body.slots.length).toBeGreaterThan(0);

      const firstSlot = body.slots[0];
      expect(firstSlot).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return empty slots on days without availability', async () => {
      const today = new Date();
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + ((0 + 7 - today.getDay()) % 7 || 7));
      const dateStr = nextSunday.toISOString().split('T')[0];

      const response = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}/slots`)
        .query({
          date: dateStr,
          serviceId: serviceId,
        })
        .expect(200);

      expect(response.status).toBe(200);

      const body = response.body as { slots: Array<unknown> };
      expect(body.slots).toHaveLength(0);
    });

    it('should return 404 when provider slug does not exist', async () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const response = await request(app.getHttpServer() as Server)
        .get('/public/non-existent-slug/slots')
        .query({
          date: dateStr,
          serviceId: serviceId,
        })
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 400 when date is missing', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}/slots`)
        .query({
          serviceId: serviceId,
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /public/:slug/schedule', () => {
    it('should create appointment successfully', async () => {
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

      const dateStr = nextMonday.toISOString().split('T')[0];
      const slotsResponse = await request(app.getHttpServer() as Server)
        .get(`/public/${providerSlug}/slots`)
        .query({
          date: dateStr,
          serviceId: serviceId,
        });

      const slotsBody = slotsResponse.body as {
        slots: string[];
      };
      const firstSlotTime = slotsBody.slots[0];

      const [hours, minutes] = firstSlotTime.split(':').map(Number);
      const startsAt = new Date(nextMonday);
      startsAt.setUTCHours(hours, minutes, 0, 0);

      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + 30);

      const response = await request(app.getHttpServer() as Server)
        .post(`/public/${providerSlug}/schedule`)
        .send({
          customerName: 'Maria Cliente',
          customerEmail: 'maria@example.com',
          customerPhone: '11988888888',
          serviceId: serviceId,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        })
        .expect(201);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');

      const appointmentInDb = await prisma.appointment.findFirst({
        where: {
          providerId: providerId,
        },
        include: {
          customer: true,
        },
      });

      expect(appointmentInDb).toBeDefined();
      expect(appointmentInDb?.customer.name).toBe('Maria Cliente');
      expect(appointmentInDb?.customer.email).toBe('maria@example.com');
      expect(appointmentInDb?.customer.phone).toBe('11988888888');
    });

    it('should return 409 when slot is already taken', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Cliente Existente',
          email: 'existente@example.com',
          phone: '11977777777',
          providerId: providerId,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endsAt = new Date(tomorrow);
      endsAt.setMinutes(30);

      await prisma.appointment.create({
        data: {
          startsAt: tomorrow,
          endsAt: endsAt,
          status: 'PENDING',
          customerId: customer.id,
          serviceId: serviceId,
          providerId: providerId,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .post(`/public/${providerSlug}/schedule`)
        .send({
          customerName: 'Novo Cliente',
          customerEmail: 'novo@example.com',
          customerPhone: '11966666666',
          serviceId: serviceId,
          startsAt: tomorrow.toISOString(),
          endsAt: endsAt.toISOString(),
        })
        .expect(409);

      expect(response.status).toBe(409);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/public/${providerSlug}/schedule`)
        .send({
          customerName: 'Maria Cliente',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should return 404 when provider slug does not exist', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endsAt = new Date(tomorrow);
      endsAt.setMinutes(30);

      const response = await request(app.getHttpServer() as Server)
        .post('/public/non-existent-slug/schedule')
        .send({
          customerName: 'Maria Cliente',
          customerEmail: 'maria@example.com',
          customerPhone: '11988888888',
          serviceId: serviceId,
          startsAt: tomorrow.toISOString(),
          endsAt: endsAt.toISOString(),
        })
        .expect(404);

      expect(response.status).toBe(404);
    });
  });
});
