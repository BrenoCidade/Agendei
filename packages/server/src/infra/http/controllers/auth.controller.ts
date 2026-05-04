import { RegisterUserUseCase } from '@/application/use-cases/user/register-user.use-case';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  forgotPasswordSchema,
  loginSchema,
  registerUserSchema,
  resetPasswordSchema,
} from '@saas/shared';
import type {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterUserDTO,
  ResetPasswordDTO,
} from '@saas/shared';
import { AuthenticateUserUseCase } from '@/application/use-cases/user/authenticate-user.use-case';
import { JwtService } from '@nestjs/jwt';
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from '@/domain/errors';
import { ResetPasswordUseCase } from '@/application/use-cases/user/reset-password.use-case';
import { ForgotPasswordUseCase } from '@/application/use-cases/user/forgot-password.use-case';
import type { Response } from 'express';

const COOKIE_NAME = 'access_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@Controller('/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly jwtService: JwtService,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/register')
  @UsePipes(new ZodValidationPipe(registerUserSchema))
  async register(@Body() body: RegisterUserDTO) {
    const { name, email, password, businessName, phone } = body;

    try {
      await this.registerUserUseCase.execute({
        name,
        email,
        password,
        businessName,
        phone,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof BusinessRuleError) {
        throw new ConflictException(error.message);
      }
      this.logger.error('Unexpected error in register', error);

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;

    try {
      const user = await this.authenticateUserUseCase.execute({
        email,
        password,
      });

      const accessToken = this.jwtService.sign({
        sub: user.id.toString(),
        email: user.email,
      });

      res.cookie(COOKIE_NAME, accessToken, COOKIE_OPTIONS);

      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError
      ) {
        throw new UnauthorizedException('Invalid credentials');
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    await this.forgotPasswordUseCase.execute({ email: body.email });
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() body: ResetPasswordDTO) {
    const { token, password } = body;
    try {
      await this.resetPasswordUseCase.execute({ token, newPassword: password });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Ocorreu um erro inesperado.');
    }
  }
}
