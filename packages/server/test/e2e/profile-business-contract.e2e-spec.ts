import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'http';
import { randomUUID } from 'crypto';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { cleanDatabase } from './helpers/cleanup';

describe('Profile Business Contract E2E', () => {
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
    await cleanDatabase(prisma);

    const email = generateUniqueEmail('profile-business');
    const businessName = `Profile Business ${randomUUID().slice(0, 8)}`;

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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not created');
    }

    userId = user.id;
  });

  it('updates business profile and public contact phone in one request', async () => {
    const response = await request(app.getHttpServer() as Server)
      .patch('/profile/business')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Studio Atualizado',
        slug: 'studio-atualizado',
        phone: '(11) 97777-6666',
        primaryColor: '#1D4ED8',
        secondaryColor: '#DBEAFE',
        accentColor: '#F97316',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      businessName: 'Studio Atualizado',
      slug: 'studio-atualizado',
      phone: '11977776666',
      primaryColor: '#1D4ED8',
      secondaryColor: '#DBEAFE',
      accentColor: '#F97316',
    });

    const userInDb = await prisma.user.findUnique({
      where: { id: userId },
    });

    expect(userInDb?.phone).toBe('11977776666');
    expect(userInDb?.businessName).toBe('Studio Atualizado');
    expect(userInDb?.slug).toBe('studio-atualizado');
    expect(userInDb?.primaryColor).toBe('#1D4ED8');
    expect(userInDb?.secondaryColor).toBe('#DBEAFE');
    expect(userInDb?.accentColor).toBe('#F97316');
  });

  it('rejects invalid branding colors when updating business profile', async () => {
    const response = await request(app.getHttpServer() as Server)
      .patch('/profile/business')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        businessName: 'Studio Atualizado',
        slug: 'studio-atualizado',
        phone: '(11) 97777-6666',
        primaryColor: 'blue',
        secondaryColor: '#DBEAFE',
        accentColor: '#F97316',
      })
      .expect(400);

    expect(response.body.message).toContain(
      'Colors must be valid HEX values like #1D4ED8',
    );
  });
});
