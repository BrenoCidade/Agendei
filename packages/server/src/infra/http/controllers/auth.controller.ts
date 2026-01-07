import { RegisterUserUseCase } from '@/application/use-cases/user/register-user.use-case';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
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
import { ValidationError } from '@/domain/errors';
import { ResetPasswordUseCase } from '@/application/use-cases/user/reset-password.use-case';
import { ForgotPasswordUseCase } from '@/application/use-cases/user/forgot-password.use-case';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly jwtService: JwtService,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

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
      console.error(error);

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDTO) {
    const { email, password } = body;

    try {
      const user = await this.authenticateUserUseCase.execute({
        email,
        password,
      });

      const payload = {
        sub: user.id.toString(),
        email: user.email,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        access_token: accessToken,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnauthorizedException('Invalid credentials');
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/forgot-password')
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    await this.forgotPasswordUseCase.execute({ email: body.email });
  }

  @Post('/reset-password')
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
