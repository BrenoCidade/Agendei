import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infra/database/database.module';
import { AuthModule } from './infra/http/auth.module';
import { ProfileModule } from './infra/http/profile.module';
import { AvailabilityModule } from './infra/http/availability.module';
import { ServicesModule } from './infra/http/services.module';
import { PublicModule } from './infra/http/public.module';
import { AppointmentsModule } from './infra/http/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ProfileModule,
    AvailabilityModule,
    ServicesModule,
    PublicModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
