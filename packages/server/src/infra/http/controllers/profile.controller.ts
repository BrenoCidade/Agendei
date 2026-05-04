import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { GetProfileUseCase } from '@/application/use-cases/user/get-profile.use-case';
import { UpdateProfileUseCase } from '@/application/use-cases/user/update-profile.use-case';
import { UpdateBusinessProfileUseCase } from '@/application/use-cases/user/update-business-profile.use-case';
import { ChangePasswordUseCase } from '@/application/use-cases/user/change-password.use-case';
import { UploadAvatarUseCase } from '@/application/use-cases/user/upload-avatar.use-case';
import { UserResponseMapper } from '@/application/mappers/user-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  updateProfileSchema,
  updateBusinessProfileSchema,
  changePasswordSchema,
  type UpdateProfileDTO,
  type UpdateBusinessProfileDTO,
  type ChangePasswordDTO,
  type UserResponseDTO,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError, ValidationError } from '@/domain/errors';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updateBusinessProfileUseCase: UpdateBusinessProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly uploadAvatarUseCase: UploadAvatarUseCase,
  ) { }

  @Get('/me')
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDTO> {
    try {
      const userId = req.user.userId;

      const user = await this.getProfileUseCase.execute({ userId });

      return UserResponseMapper.toDTO(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Patch('/')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(updateProfileSchema))
    body: UpdateProfileDTO,
  ): Promise<UserResponseDTO> {
    try {
      const userId = req.user.userId;

      const user = await this.updateProfileUseCase.execute({
        userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
      });

      return UserResponseMapper.toDTO(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        throw new ConflictException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Patch('/business')
  async updateBusinessProfile(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(updateBusinessProfileSchema))
    body: UpdateBusinessProfileDTO,
  ): Promise<UserResponseDTO> {
    try {
      const userId = req.user.userId;

      const user = await this.updateBusinessProfileUseCase.execute({
        userId,
        businessName: body.businessName,
        slug: body.slug,
        phone: body.phone,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
      });

      return UserResponseMapper.toDTO(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        throw new ConflictException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Patch('/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: ChangePasswordDTO,
  ): Promise<void> {
    try {
      const userId = req.user.userId;

      await this.changePasswordUseCase.execute({
        userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB — rejeita antes de bufferizar
  }))
  async uploadAvatar(
    @Request() req: RequestWithUser & ExpressRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDTO> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const userId = req.user.userId;
      const protocol = req.protocol;
      const host = req.get('host') ?? 'localhost';
      const baseUrl = `${protocol}://${host}`;

      const avatarUrl = await this.uploadAvatarUseCase.execute({
        userId,
        buffer: file.buffer,
        mimetype: file.mimetype,
        baseUrl,
      });

      void avatarUrl; // URL already persisted in use-case
      const user = await this.getProfileUseCase.execute({ userId });
      return UserResponseMapper.toDTO(user);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ValidationError) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }
}
