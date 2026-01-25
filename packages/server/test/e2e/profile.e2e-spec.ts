import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Profile E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let testEmail: string;
  let testBusiness: string;

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

    testEmail = generateUniqueEmail('profile-user');
    testBusiness = `Test Business ${randomUUID().substring(0, 8)}`;

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

  describe('GET /profile/me', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/profile/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testEmail);
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('businessName', testBusiness);
      expect(response.body).toHaveProperty('slug');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/profile/me')
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/profile/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /profile', () => {
    it('should update user profile successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          email: testEmail,
          phone: '11888888888',
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('phone', '11888888888');

      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(userInDb?.name).toBe('Updated Name');
      expect(userInDb?.phone).toBe('11888888888');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/profile')
        .send({
          name: 'Updated Name',
          email: 'any@email.com',
        })
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /profile/business', () => {
    it('should update business profile successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/profile/business')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: 'Updated Business',
          slug: 'updated-business',
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('businessName', 'Updated Business');
      expect(response.body).toHaveProperty('slug', 'updated-business');

      const userInDb = await prisma.user.findUnique({
        where: { id: userId },
      });

      expect(userInDb?.businessName).toBe('Updated Business');
      expect(userInDb?.slug).toBe('updated-business');
    });

    it('should return 409 when slug already exists', async () => {
      await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@email.com',
          passwordHash: 'hash123',
          businessName: 'Other Business',
          slug: 'existing-slug',
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .patch('/profile/business')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessName: 'Updated Business',
          slug: 'existing-slug',
        })
        .expect(409);

      expect(response.status).toBe(409);
    });

    it('should return 400 when slug has invalid format', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/profile/business')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slug: 'Invalid Slug With Spaces',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});
