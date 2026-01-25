import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { GetAvailabilityUseCase } from '@/application/use-cases/availability/get-availability.use-case';
import { SetAvailabilityUseCase } from '@/application/use-cases/availability/set-availability.use-case';
import { DeleteAvailabilityUseCase } from '@/application/use-cases/availability/delete-availability.use-case';
import { AvailabilityResponseMapper } from '@/application/mappers/availability-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  setAvailabilitySchema,
  deleteAvailabilitySchema,
  type SetAvailabilityDTO,
  type DeleteAvailabilityDTO,
  type AvailabilityResponseDTO,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('/availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(
    private readonly getAvailabilityUseCase: GetAvailabilityUseCase,
    private readonly setAvailabilityUseCase: SetAvailabilityUseCase,
    private readonly deleteAvailabilityUseCase: DeleteAvailabilityUseCase,
  ) {}

  @Get('/')
  async getAvailability(
    @Request() req: RequestWithUser,
  ): Promise<AvailabilityResponseDTO[]> {
    try {
      const providerId = req.user.userId;

      const availabilities = await this.getAvailabilityUseCase.execute({
        providerId,
      });

      return availabilities.map((availability) =>
        AvailabilityResponseMapper.toDTO(availability),
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/')
  async setAvailability(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(setAvailabilitySchema))
    body: SetAvailabilityDTO,
  ): Promise<AvailabilityResponseDTO> {
    try {
      const providerId = req.user.userId;

      const availability = await this.setAvailabilityUseCase.execute({
        providerId,
        dayOfweek: body.dayOfWeek,
        slots: body.slots,
      });

      return AvailabilityResponseMapper.toDTO(availability);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Delete('/:dayOfWeek')
  async deleteAvailability(
    @Request() req: RequestWithUser,
    @Param(new ZodValidationPipe(deleteAvailabilitySchema))
    params: DeleteAvailabilityDTO,
  ): Promise<void> {
    try {
      const providerId = req.user.userId;

      // Buscar availability pelo providerId e dayOfWeek
      const availabilities = await this.getAvailabilityUseCase.execute({
        providerId,
      });

      const availability = availabilities.find(
        (a) => a.dayOfWeek === params.dayOfWeek,
      );

      if (!availability) {
        throw new NotFoundError(
          'Availability not found for this day',
          'AVAILABILITY_NOT_FOUND',
        );
      }

      await this.deleteAvailabilityUseCase.execute({
        availabilityId: availability.id,
        providerId,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        throw new ForbiddenException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }
}
