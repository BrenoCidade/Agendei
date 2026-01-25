import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { randomUUID } from 'crypto';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const email = generateUniqueEmail('breno');
      const businessName = `Breno's Barbershop ${randomUUID().substring(0, 8)}`;
      const registerDto = {
        name: 'Breno Cidade',
        email,
        password: 'Test@1234',
        businessName,
        phone: '11999999999',
      };

      const response = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.status).toBe(201);

      const userInDb = await prisma.user.findUnique({
        where: { email },
      });

      expect(userInDb).toBeDefined();
      expect(userInDb?.name).toBe('Breno Cidade');
      expect(userInDb?.email).toBe(email);
      expect(userInDb?.businessName).toBe(businessName);

      expect(userInDb?.passwordHash).toBeDefined();
      expect(userInDb?.passwordHash).not.toBe('123456');

      expect(userInDb?.slug).toBeDefined();
      expect(userInDb?.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should return 409 when email already exists', async () => {
      const duplicateEmail = generateUniqueEmail('duplicate');
      await prisma.user.create({
        data: {
          name: 'Existing User',
          email: duplicateEmail,
          passwordHash: 'hashed123',
          businessName: 'Existing Business',
          slug: `existing-business-${Date.now()}`,
        },
      });

      const response = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: duplicateEmail,
          password: 'Test@1234',
          businessName: 'New Business',
          phone: '11888888888',
        })
        .expect(409);

      expect(response.status).toBe(409);
      const usersCount = await prisma.user.count();
      expect(usersCount).toBe(1);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'Breno Cidade',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'Breno Cidade',
          email: 'invalid-email',
          password: 'Test@1234',
          businessName: 'Business',
          phone: '11999999999',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    let testEmail: string;

    beforeEach(async () => {
      testEmail = generateUniqueEmail('login');
      const testBusiness = `Test Business ${Date.now()}`;
      await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'Breno Cidade',
          email: testEmail,
          password: 'Test@1234',
          businessName: testBusiness,
          phone: '11999999999',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'Test@1234',
        })
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');

      const body = response.body as { access_token: string };
      expect(body.access_token).toBeDefined();
      expect(typeof body.access_token).toBe('string');

      const tokenParts = body.access_token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should return 401 when email does not exist', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: 'nonexistent@email.com',
          password: 'Test@1234',
        })
        .expect(401);

      expect(response.status).toBe(401);
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should generate password reset token for existing user', async () => {
      const email = generateUniqueEmail('forgot');
      const testBusiness = `Test Business ${Date.now()}`;
      await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'Breno Cidade',
          email,
          password: 'Test@1234',
          businessName: testBusiness,
          phone: '11999999999',
        });

      const response = await request(app.getHttpServer() as Server)
        .post('/auth/forgot-password')
        .send({
          email,
        })
        .expect(200);

      expect(response.status).toBe(200);

      const userInDb = await prisma.user.findUnique({
        where: { email },
      });

      expect(userInDb?.passwordResetToken).toBeDefined();
      expect(userInDb?.passwordResetToken).not.toBeNull();
      expect(userInDb?.passwordResetTokenExpiresAt).toBeDefined();

      const expiresAt = userInDb?.passwordResetTokenExpiresAt;
      expect(expiresAt).toBeDefined();
      if (expiresAt) {
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should return 200 even when email does not exist (security)', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@email.com',
        })
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;
    let resetEmail: string;

    beforeEach(async () => {
      resetEmail = generateUniqueEmail('reset');
      const testBusiness = `Test Business ${Date.now()}`;
      await request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          name: 'Breno Cidade',
          email: resetEmail,
          password: 'Test@1234',
          businessName: testBusiness,
          phone: '11999999999',
        });

      await request(app.getHttpServer() as Server)
        .post('/auth/forgot-password')
        .send({
          email: resetEmail,
        });

      const user = await prisma.user.findUnique({
        where: { email: resetEmail },
      });

      resetToken = user?.passwordResetToken || '';
    });

    it('should reset password successfully with valid token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newPassword123@',
        })
        .expect(200);

      expect(response.status).toBe(200);

      const userInDb = await prisma.user.findUnique({
        where: { email: resetEmail },
      });

      expect(userInDb?.passwordResetToken).toBeNull();
      expect(userInDb?.passwordResetTokenExpiresAt).toBeNull();

      const loginResponse = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: resetEmail,
          password: 'newPassword123@',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('access_token');
    });

    it('should return 400 when token is invalid', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-123',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
});
