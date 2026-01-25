import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Services E2E Tests', () => {
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

    const testEmail = generateUniqueEmail('service-user');
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

  describe('POST /services', () => {
    it('should create a new service successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Corte de Cabelo',
          description: 'Corte masculino tradicional',
          durationInMinutes: 30,
          priceInCents: 3000,
        })
        .expect(201);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Corte de Cabelo');
      expect(response.body).toHaveProperty('durationInMinutes', 30);
      expect(response.body).toHaveProperty('priceInCents', 3000);

      const serviceInDb = await prisma.service.findFirst({
        where: { name: 'Corte de Cabelo' },
      });

      expect(serviceInDb).toBeDefined();
      expect(serviceInDb?.providerId).toBe(userId);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/services')
        .send({
          name: 'Corte de Cabelo',
          durationInMinutes: 30,
          priceInCents: 3000,
        })
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Corte de Cabelo',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should return 400 when price is negative', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Corte de Cabelo',
          durationInMinutes: 30,
          priceInCents: -1000,
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /services', () => {
    beforeEach(async () => {
      await prisma.service.createMany({
        data: [
          {
            name: 'Corte de Cabelo',
            durationInMinutes: 30,
            priceInCents: 3000,
            providerId: userId,
            isActive: true,
          },
          {
            name: 'Barba',
            durationInMinutes: 20,
            priceInCents: 2000,
            providerId: userId,
            isActive: true,
          },
          {
            name: 'Serviço Inativo',
            durationInMinutes: 15,
            priceInCents: 1500,
            providerId: userId,
            isActive: false,
          },
        ],
      });
    });

    it('should list all services of the authenticated user', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/services')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
    });

    it('should list only active services when onlyActive=true', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/services?onlyActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/services')
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /services/:id', () => {
    let serviceId: string;

    beforeEach(async () => {
      const service = await prisma.service.create({
        data: {
          name: 'Corte de Cabelo',
          durationInMinutes: 30,
          priceInCents: 3000,
          providerId: userId,
        },
      });
      serviceId = service.id;
    });

    it('should update service successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Corte Premium',
          durationInMinutes: 45,
          priceInCents: 5000,
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Corte Premium');
      expect(response.body).toHaveProperty('durationInMinutes', 45);
      expect(response.body).toHaveProperty('priceInCents', 5000);

      const serviceInDb = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(serviceInDb?.name).toBe('Corte Premium');
    });

    it('should return 404 when service does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put('/services/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Service',
          durationInMinutes: 30,
          priceInCents: 3000,
        })
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 403 when trying to update service from another provider', async () => {
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

      const response = await request(app.getHttpServer() as Server)
        .put(`/services/${otherService.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Hacked Service',
          durationInMinutes: 30,
          priceInCents: 3000,
        })
        .expect(403);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /services/:id', () => {
    let serviceId: string;

    beforeEach(async () => {
      const service = await prisma.service.create({
        data: {
          name: 'Corte de Cabelo',
          durationInMinutes: 30,
          priceInCents: 3000,
          providerId: userId,
        },
      });
      serviceId = service.id;
    });

    it('should delete service successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete(`/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);

      const serviceInDb = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      expect(serviceInDb).toBeNull();
    });

    it('should return 404 when service does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .delete('/services/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 403 when trying to delete service from another provider', async () => {
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

      const response = await request(app.getHttpServer() as Server)
        .delete(`/services/${otherService.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.status).toBe(403);
    });
  });
});
