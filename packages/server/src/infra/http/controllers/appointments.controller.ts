import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { ListAppointmentsUseCase } from '@/application/use-cases/appointment/list-appointments.use-case';
import { ConfirmAppointmentUseCase } from '@/application/use-cases/appointment/confirm-appointment.use-case';
import { CancelAppointmentUseCase } from '@/application/use-cases/appointment/cancel-appointment.use-case';
import { AppointmentResponseMapper } from '@/application/mappers/appointment-response.mapper';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  listAppointmentsQuerySchema,
  cancelAppointmentSchema,
  type ListAppointmentsQueryDTO,
  type CancelAppointmentDTO,
  type AppointmentResponse,
} from '@saas/shared';
import { BusinessRuleError, NotFoundError } from '@/domain/errors';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import { Appointment } from '@/domain/entities/appointment';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly listAppointmentsUseCase: ListAppointmentsUseCase,
    private readonly confirmAppointmentUseCase: ConfirmAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
  ) {}

  @Get('/')
  async listAppointments(
    @Request() req: RequestWithUser,
    @Query(new ZodValidationPipe(listAppointmentsQuerySchema))
    query: ListAppointmentsQueryDTO,
  ): Promise<AppointmentResponse[]> {
    try {
      const providerId = req.user.userId;

      const appointments = await this.listAppointmentsUseCase.execute({
        providerId,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        status: query.status,
      });

      return this.buildAppointmentResponses(appointments);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Patch('/:id/confirm')
  async confirmAppointment(
    @Request() req: RequestWithUser,
    @Param('id') appointmentId: string,
  ): Promise<AppointmentResponse> {
    try {
      const providerId = req.user.userId;

      const appointment = await this.confirmAppointmentUseCase.execute({
        appointmentId,
        providerId,
      });

      return this.buildAppointmentResponse(appointment);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        if (error.code === 'APPOINTMENT_CONFIRM_FORBIDDEN') {
          throw new ForbiddenException(error.message);
        }
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  @Patch('/:id/cancel')
  async cancelAppointment(
    @Request() req: RequestWithUser,
    @Param('id') appointmentId: string,
    @Body(new ZodValidationPipe(cancelAppointmentSchema))
    body: CancelAppointmentDTO,
  ): Promise<AppointmentResponse> {
    try {
      const providerId = req.user.userId;

      const appointment = await this.cancelAppointmentUseCase.execute({
        appointmentId,
        cancelReason: body.reason,
        canceledBy: body.canceledBy,
        actorId: providerId,
      });

      return this.buildAppointmentResponse(appointment);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof BusinessRuleError) {
        if (error.code === 'APPOINTMENT_CANCEL_FORBIDDEN') {
          throw new ForbiddenException(error.message);
        }
        throw new BadRequestException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }

  private async buildAppointmentResponses(
    appointments: Appointment[],
  ): Promise<AppointmentResponse[]> {
    const customerIds = [
      ...new Set(appointments.map((item) => item.customerId)),
    ];
    const serviceIds = [...new Set(appointments.map((item) => item.serviceId))];

    const [customers, services] = await Promise.all([
      this.customerRepository.findByIds(customerIds),
      this.serviceRepository.findByIds(serviceIds),
    ]);

    const customerById = new Map(
      customers.map((customer) => [
        customer.id,
        {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        },
      ]),
    );

    const serviceById = new Map(
      services.map((service) => [
        service.id,
        {
          id: service.id,
          name: service.name,
          durationInMinutes: service.durationInMinutes,
          priceInCents: service.priceInCents,
        },
      ]),
    );

    return appointments.map((appointment) =>
      AppointmentResponseMapper.toDTO(appointment, {
        customer: customerById.get(appointment.customerId),
        service: serviceById.get(appointment.serviceId),
      }),
    );
  }

  private async buildAppointmentResponse(
    appointment: Appointment,
  ): Promise<AppointmentResponse> {
    const [response] = await this.buildAppointmentResponses([appointment]);
    return response;
  }
}
