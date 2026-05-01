import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './infra/database/database.module';
import { AuthModule } from './infra/http/auth.module';
import { ProfileModule } from './infra/http/profile.module';
import { AvailabilityModule } from './infra/http/availability.module';
import { ServicesModule } from './infra/http/services.module';
import { PublicModule } from './infra/http/public.module';
import { AppointmentsModule } from './infra/http/appointments.module';
import { CustomersModule } from './infra/http/customers.module';
import { HealthController } from './infra/http/controllers/health.controller';
import { RequestIdMiddleware } from './infra/http/middleware/request-id.middleware';
import { CustomThrottlerGuard } from './infra/http/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => (req as any).id,
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, translateTime: 'SYS:standard' },
              }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    AuthModule,
    ProfileModule,
    AvailabilityModule,
    ServicesModule,
    PublicModule,
    AppointmentsModule,
    CustomersModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
