import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from '../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthenticateUserUseCase } from '@/application/use-cases/user/authenticate-user.use-case';
import { ConfigService } from '@nestjs/config';
import { BcryptPasswordService } from '../service/BcryptPasswordService';
import { AuthController } from './controllers/auth.controller';
import { MockEmailGateway } from '../service/MockEmailGateway';
import { ResetPasswordUseCase } from '@/application/use-cases/user/reset-password.use-case';
import { ForgotPasswordUseCase } from '@/application/use-cases/user/forgot-password.use-case';
import { RegisterUserUseCase } from '@/application/use-cases/user/register-user.use-case';

@Module({
  imports: [
    PassportModule,
    DatabaseModule,
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
    {
      provide: 'IEmailGateway',
      useClass: MockEmailGateway,
    },
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
