import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Appointments E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let serviceId: string;
  let customerId: string;
  let appointmentId: string;

  const generateUniqueEmail = (prefix: string) =>
    `${prefix}-${randomUUID()}@test.com`;

  interface AppointmentResponse {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string;
    customerId: string;
    serviceId: string;
    providerId: string;
  }

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

    const testEmail = generateUniqueEmail('appointment-user');
    const testBusiness = `Test Business ${randomUUID().substring(0, 8)}`;

    const registerResponse = await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: 'Test@1234',
        businessName: testBusiness,
        phone: '11999999999',
      });

    if (registerResponse.status !== 201) {
      throw new Error(
        `Registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.body)}`,
      );
    }

    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'Test@1234',
      });

    if (loginResponse.status !== 200) {
      throw new Error(
        `Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`,
      );
    }

    const body = loginResponse.body as { access_token: string };
    authToken = body.access_token;

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (!user) {
      throw new Error('User not created in beforeEach');
    }

    userId = user.id;

    const service = await prisma.service.create({
      data: {
        name: 'Corte de Cabelo',
        durationInMinutes: 30,
        priceInCents: 3000,
        providerId: userId,
      },
    });
    serviceId = service.id;

    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: generateUniqueEmail('customer'),
        phone: '11988888888',
        providerId: userId,
      },
    });
    customerId = customer.id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endsAt = new Date(tomorrow);
    endsAt.setMinutes(30);

    const appointment = await prisma.appointment.create({
      data: {
        startsAt: tomorrow,
        endsAt: endsAt,
        status: 'PENDING',
        customerId: customerId,
        serviceId: serviceId,
        providerId: userId,
      },
    });
    appointmentId = appointment.id;
  });

  describe('GET /appointments', () => {
    it('should list all appointments', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body as AppointmentResponse[];
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(body[0]).toHaveProperty('id', appointmentId);
      expect(body[0]).toHaveProperty('status', 'PENDING');
    });

    it('should filter appointments by status', async () => {
      const afterTomorrow = new Date();
      afterTomorrow.setDate(afterTomorrow.getDate() + 2);
      afterTomorrow.setHours(14, 0, 0, 0);

      const confirmedEndsAt = new Date(afterTomorrow);
      confirmedEndsAt.setMinutes(30);

      await prisma.appointment.create({
        data: {
          startsAt: afterTomorrow,
          endsAt: confirmedEndsAt,
          status: 'CONFIRMED',
          customerId: customerId,
          serviceId: serviceId,
          providerId: userId,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .get('/appointments?status=CONFIRMED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body as AppointmentResponse[];

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(body[0]).toHaveProperty('status', 'CONFIRMED');
    });

    it('should filter appointments by date range', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const startDate = today.toISOString().split('T')[0];
      const endDate = tomorrow.toISOString().split('T')[0];

      const response = await request(app.getHttpServer() as Server)
        .get(`/appointments?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/appointments')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return empty array when no appointments', async () => {
      await prisma.appointment.deleteMany();

      const response = await request(app.getHttpServer() as Server)
        .get('/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('PATCH /appointments/:id/confirm', () => {
    it('should confirm appointment successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', appointmentId);
      expect(response.body).toHaveProperty('status', 'CONFIRMED');

      const appointmentInDb = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      expect(appointmentInDb?.status).toBe('CONFIRMED');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/confirm`)
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 404 when appointment does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/appointments/non-existent-id/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 403 when trying to confirm appointment from another provider', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@email.com',
          passwordHash: 'hash123',
          businessName: 'Other Business',
          slug: 'other-business',
        },
      });

      const otherService = await prisma.service.create({
        data: {
          name: 'Other Service',
          durationInMinutes: 30,
          priceInCents: 3000,
          providerId: otherUser.id,
        },
      });

      const otherCustomer = await prisma.customer.create({
        data: {
          name: 'Other Customer',
          email: 'othercust@email.com',
          phone: '11977777777',
          providerId: otherUser.id,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const endsAt = new Date(tomorrow);
      endsAt.setMinutes(30);

      const otherAppointment = await prisma.appointment.create({
        data: {
          startsAt: tomorrow,
          endsAt: endsAt,
          status: 'PENDING',
          customerId: otherCustomer.id,
          serviceId: otherService.id,
          providerId: otherUser.id,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${otherAppointment.id}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('should return 400 when appointment is already confirmed', async () => {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMED' },
      });

      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /appointments/:id/cancel', () => {
    it('should cancel appointment successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Imprevisto',
          canceledBy: 'PROVIDER',
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', appointmentId);
      expect(response.body).toHaveProperty('status', 'CANCELLED');

      const appointmentInDb = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      expect(appointmentInDb?.status).toBe('CANCELLED');
      expect(appointmentInDb?.cancelReason).toBe('Imprevisto');
      expect(appointmentInDb?.canceledBy).toBe('PROVIDER');
      expect(appointmentInDb?.canceledAt).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/cancel`)
        .send({
          reason: 'Test',
        })
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 404 when appointment does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${randomUUID()}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'TestReason',
          canceledBy: 'PROVIDER',
        })
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 403 when trying to cancel appointment from another provider', async () => {
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@email.com',
          passwordHash: 'hash123',
          businessName: 'Other Business',
          slug: 'other-business',
        },
      });

      const otherService = await prisma.service.create({
        data: {
          name: 'Other Service',
          durationInMinutes: 30,
          priceInCents: 3000,
          providerId: otherUser.id,
        },
      });

      const otherCustomer = await prisma.customer.create({
        data: {
          name: 'Other Customer',
          email: 'othercust@email.com',
          phone: '11977777777',
          providerId: otherUser.id,
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);

      const endsAt = new Date(tomorrow);
      endsAt.setMinutes(30);

      const otherAppointment = await prisma.appointment.create({
        data: {
          startsAt: tomorrow,
          endsAt: endsAt,
          status: 'PENDING',
          customerId: otherCustomer.id,
          serviceId: otherService.id,
          providerId: otherUser.id,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${otherAppointment.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'TestReason',
          canceledBy: 'PROVIDER',
        })
        .expect(403);

      expect(response.status).toBe(403);
    });

    it('should return 400 when appointment is already cancelled', async () => {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED',
          cancelReason: 'Previous',
          canceledBy: 'PROVIDER',
          canceledAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .patch(`/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'TestReason',
          canceledBy: 'PROVIDER',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});
