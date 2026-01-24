import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
  UsePipes,
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

      return appointments.map((appointment) =>
        AppointmentResponseMapper.toDTO(appointment),
      );
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

      return AppointmentResponseMapper.toDTO(appointment);
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

  @Patch('/:id/cancel')
  @UsePipes(new ZodValidationPipe(cancelAppointmentSchema))
  async cancelAppointment(
    @Request() req: RequestWithUser,
    @Param('id') appointmentId: string,
    @Body() body: CancelAppointmentDTO,
  ): Promise<AppointmentResponse> {
    try {
      const providerId = req.user.userId;

      const appointment = await this.cancelAppointmentUseCase.execute({
        appointmentId,
        cancelReason: body.reason,
        canceledBy: body.canceledBy,
        actorId: providerId,
      });

      return AppointmentResponseMapper.toDTO(appointment);
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
