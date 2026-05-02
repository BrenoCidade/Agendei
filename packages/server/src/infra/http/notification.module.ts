import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationGateway } from '../ws/notification.gateway';
import { BrevoEmailGateway } from '../service/BrevoEmailGateway';
import { MockEmailGateway } from '../service/MockEmailGateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    NotificationGateway,
    {
      provide: 'INotificationGateway',
      useExisting: NotificationGateway,
    },
    {
      provide: 'IEmailGateway',
      useClass: process.env.NODE_ENV === 'production' ? BrevoEmailGateway : MockEmailGateway,
    },
  ],
  exports: ['INotificationGateway', 'IEmailGateway'],
})
export class NotificationModule {}
