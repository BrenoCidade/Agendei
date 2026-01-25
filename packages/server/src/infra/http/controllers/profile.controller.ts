import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { GetProfileUseCase } from '@/application/use-cases/user/get-profile.use-case';
import { UpdateProfileUseCase } from '@/application/use-cases/user/update-profile.use-case';
import { UpdateBusinessProfileUseCase } from '@/application/use-cases/user/update-business-profile.use-case';
import { UserResponseMapper } from '@/application/mappers/user-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  updateProfileSchema,
  updateBusinessProfileSchema,
  type UpdateProfileDTO,
  type UpdateBusinessProfileDTO,
  type UserResponseDTO,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';

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
  ) {}

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
}
