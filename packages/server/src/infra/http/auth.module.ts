import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthenticateUserUseCase } from '@/application/use-cases/user/authenticate-user.use-case';
import { ConfigService } from '@nestjs/config';
import { BcryptPasswordService } from '../service/BcryptPasswordService';
import { AuthController } from './controllers/auth.controller';
import { ResetPasswordUseCase } from '@/application/use-cases/user/reset-password.use-case';
import { ForgotPasswordUseCase } from '@/application/use-cases/user/forgot-password.use-case';
import { RegisterUserUseCase } from '@/application/use-cases/user/register-user.use-case';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    PassportModule,
    DatabaseModule,
    NotificationModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    JwtStrategy,
    AuthenticateUserUseCase,
    {
      provide: 'IPasswordService',
      useClass: BcryptPasswordService,
    },
    RegisterUserUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  controllers: [AuthController],
  exports: [
    AuthenticateUserUseCase,
    RegisterUserUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
})
export class AuthModule {}
