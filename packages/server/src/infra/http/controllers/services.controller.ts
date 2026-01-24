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
  Put,
  Request,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { CreateServiceUseCase } from '@/application/use-cases/service/create-service.use-case';
import { ListServicesUseCase } from '@/application/use-cases/service/list-services.use-case';
import { UpdateServiceUseCase } from '@/application/use-cases/service/update-service.use-case';
import { DeleteServiceUseCase } from '@/application/use-cases/service/delete-service.use-case';
import { ServiceResponseMapper } from '@/application/mappers/service-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceDTO,
  type UpdateServiceDTO,
  type ServiceResponseDTO,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('/services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(
    private readonly createServiceUseCase: CreateServiceUseCase,
    private readonly listServicesUseCase: ListServicesUseCase,
    private readonly updateServiceUseCase: UpdateServiceUseCase,
    private readonly deleteServiceUseCase: DeleteServiceUseCase,
  ) {}

  @Get('/')
  async listServices(
    @Request() req: RequestWithUser,
  ): Promise<ServiceResponseDTO[]> {
    try {
      const providerId = req.user.userId;

      const services = await this.listServicesUseCase.execute({
        providerId,
        onlyActive: false,
      });

      return services.map((service) => ServiceResponseMapper.toDTO(service));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Post('/')
  @UsePipes(new ZodValidationPipe(createServiceSchema))
  async createService(
    @Request() req: RequestWithUser,
    @Body() body: CreateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    try {
      const providerId = req.user.userId;

      const service = await this.createServiceUseCase.execute({
        providerId,
        name: body.name,
        description: body.description,
        durationInMinutes: body.durationInMinutes,
        priceInCents: body.priceInCents,
      });

      return ServiceResponseMapper.toDTO(service);
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

  @Put('/:id')
  @UsePipes(new ZodValidationPipe(updateServiceSchema))
  async updateService(
    @Request() req: RequestWithUser,
    @Param('id') serviceId: string,
    @Body() body: UpdateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    try {
      const providerId = req.user.userId;

      const service = await this.updateServiceUseCase.execute({
        serviceId,
        providerId,
        name: body.name!,
        description: body.description,
        durationInMinutes: body.durationInMinutes!,
        priceInCents: body.priceInCents!,
      });

      return ServiceResponseMapper.toDTO(service);
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

  @Delete('/:id')
  async deleteService(
    @Request() req: RequestWithUser,
    @Param('id') serviceId: string,
  ): Promise<void> {
    try {
      const providerId = req.user.userId;

      await this.deleteServiceUseCase.execute({
        serviceId,
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
