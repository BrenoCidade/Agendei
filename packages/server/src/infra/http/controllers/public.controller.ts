import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { GetProviderBySlugUseCase } from '@/application/use-cases/user/get-provider-by-slug.use-case';
import { FetchAvailableSlotsUseCase } from '@/application/use-cases/appointment/fetch-available-slots.use-case';
import { CreateAppointmentUseCase } from '@/application/use-cases/appointment/create-appointment.use-case';
import { ListServicesUseCase } from '@/application/use-cases/service/list-services.use-case';
import { ServiceResponseMapper } from '@/application/mappers/service-response.mapper';
import { AppointmentResponseMapper } from '@/application/mappers/appointment-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  fetchAvailableSlotsSchema,
  type FetchAvailableSlotsDTO,
  type ServiceResponseDTO,
  type AppointmentResponse,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import { z } from 'zod';

// Schema específico para agendamento público (inclui dados do cliente)
const publicScheduleSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name must have at least 2 characters')
    .max(50, 'Name must have at most 50 characters')
    .trim(),
  customerEmail: z.string().email('Invalid email').trim(),
  customerPhone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,15}$/, 'Invalid phone number')),
  serviceId: z.string().uuid('Invalid service ID'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  observation: z.string().max(500).trim().optional(),
});

type PublicScheduleDTO = z.infer<typeof publicScheduleSchema>;

interface PublicProviderProfileDTO {
  slug: string;
  businessName: string;
  name: string;
  phone: string | null;
  services: ServiceResponseDTO[];
}

@Controller('/public')
export class PublicController {
  constructor(
    private readonly getProviderBySlugUseCase: GetProviderBySlugUseCase,
    private readonly fetchAvailableSlotsUseCase: FetchAvailableSlotsUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly listServicesUseCase: ListServicesUseCase,
  ) {}

  @Get('/:slug')
  async getProviderProfile(
    @Param('slug') slug: string,
  ): Promise<PublicProviderProfileDTO> {
    try {
      const provider = await this.getProviderBySlugUseCase.execute({ slug });

      const services = await this.listServicesUseCase.execute({
        providerId: provider.id,
        onlyActive: true,
      });

      return {
        slug: provider.slug,
        businessName: provider.businessName,
        name: provider.name,
        phone: provider.phone,
        services: services.map((service) =>
          ServiceResponseMapper.toDTO(service),
        ),
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Get('/:slug/slots')
  async getAvailableSlots(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(fetchAvailableSlotsSchema))
    query: FetchAvailableSlotsDTO,
  ): Promise<{ date: string; slots: string[] }> {
    try {
      const provider = await this.getProviderBySlugUseCase.execute({ slug });

      const date = new Date(query.date);

      const slots = await this.fetchAvailableSlotsUseCase.execute({
        providerId: provider.id,
        serviceId: query.serviceId,
        date,
      });

      return {
        date: query.date,
        slots,
      };
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

  @Post('/:slug/schedule')
  async scheduleAppointment(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(publicScheduleSchema))
    body: PublicScheduleDTO,
  ): Promise<AppointmentResponse> {
    try {
      const provider = await this.getProviderBySlugUseCase.execute({ slug });

      const appointment = await this.createAppointmentUseCase.execute({
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        providerId: provider.id,
        serviceId: body.serviceId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        observation: body.observation,
      });

      return AppointmentResponseMapper.toDTO(appointment);
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
