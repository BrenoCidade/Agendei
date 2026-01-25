import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Availability E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

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
    await prisma.appointment.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.user.deleteMany();

    const testEmail = generateUniqueEmail('availability-user');
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
  });

  describe('POST /availability', () => {
    it('should create availability successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dayOfWeek: 1,
          slots: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '18:00' },
          ],
        })
        .expect(201);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('dayOfWeek', 1);
      expect(response.body).toHaveProperty('slots');

      const availabilityInDb = await prisma.availability.findFirst({
        where: {
          providerId: userId,
          dayOfWeek: 1,
        },
      });

      expect(availabilityInDb).toBeDefined();
      expect(availabilityInDb?.isActive).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/availability')
        .send({
          dayOfWeek: 1,
          slots: [{ start: '09:00', end: '18:00' }],
        })
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 400 when dayOfWeek is invalid', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dayOfWeek: 7,
          slots: [{ start: '09:00', end: '18:00' }],
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should return 400 when slots are missing', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dayOfWeek: 1,
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should update existing availability for same day', async () => {
      await prisma.availability.create({
        data: {
          dayOfWeek: 1,
          slots: [{ start: '08:00', end: '12:00' }],
          providerId: userId,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .post('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dayOfWeek: 1,
          slots: [{ start: '09:00', end: '18:00' }],
        })
        .expect(201);

      expect(response.status).toBe(201);

      const availabilitiesCount = await prisma.availability.count({
        where: {
          providerId: userId,
          dayOfWeek: 1,
        },
      });

      expect(availabilitiesCount).toBe(1);
    });
  });

  describe('GET /availability', () => {
    beforeEach(async () => {
      await prisma.availability.createMany({
        data: [
          {
            dayOfWeek: 1,
            slots: [{ start: '09:00', end: '18:00' }],
            providerId: userId,
            isActive: true,
          },
          {
            dayOfWeek: 2,
            slots: [{ start: '09:00', end: '18:00' }],
            providerId: userId,
            isActive: true,
          },
          {
            dayOfWeek: 5,
            slots: [{ start: '14:00', end: '20:00' }],
            providerId: userId,
            isActive: false,
          },
        ],
      });
    });

    it('should list all availabilities', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/availability')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return empty array when no availabilities', async () => {
      await prisma.availability.deleteMany();

      const response = await request(app.getHttpServer() as Server)
        .get('/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('DELETE /availability/:dayOfWeek', () => {
    beforeEach(async () => {
      await prisma.availability.create({
        data: {
          dayOfWeek: 1,
          slots: [{ start: '09:00', end: '18:00' }],
          providerId: userId,
        },
      });
    });

    it('should delete availability successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete('/availability/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);

      const availabilityInDb = await prisma.availability.findFirst({
        where: {
          providerId: userId,
          dayOfWeek: 1,
        },
      });

      expect(availabilityInDb).toBeNull();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete('/availability/1')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 404 when availability does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete('/availability/3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 400 when dayOfWeek is invalid', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete('/availability/8')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});
