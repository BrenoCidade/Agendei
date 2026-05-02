import { Appointment } from '@/domain/entities/appointment';
import type { CancelationActor } from '@saas/shared';
import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import type { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import type { INotificationGateway } from '@/domain/gateways/INotificationGateway';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable, Logger } from '@nestjs/common';

interface CancelAppointmentInput {
  appointmentId: string;
  cancelReason: string;
  canceledBy: CancelationActor;
  actorId: string;
}

@Injectable()
export class CancelAppointmentUseCase {
  private readonly logger = new Logger(CancelAppointmentUseCase.name);

  constructor(
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
    @Inject('IEmailGateway')
    private readonly emailGateway: IEmailGateway,
    @Inject('INotificationGateway')
    private readonly notificationGateway: INotificationGateway,
  ) {}

  async execute(input: CancelAppointmentInput): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(
      input.appointmentId,
    );

    if (!appointment) {
      throw new NotFoundError('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    this.validateCancellationPermission(appointment, input);

    appointment.cancel(input.cancelReason, input.canceledBy);

    await this.appointmentRepository.save(appointment);

    this.sendNotifications(appointment, input.canceledBy).catch(
      (err: unknown) => this.logger.error('Failed to send cancellation notifications', err),
    );

    return appointment;
  }

  private validateCancellationPermission(
    appointment: Appointment,
    input: CancelAppointmentInput,
  ): void {
    if (input.canceledBy === 'PROVIDER') {
      if (appointment.providerId !== input.actorId) {
        throw new BusinessRuleError(
          'You do not have permission to cancel this appointment',
          'APPOINTMENT_CANCEL_FORBIDDEN',
        );
      }
    }

    if (input.canceledBy === 'CUSTOMER') {
      if (appointment.customerId !== input.actorId) {
        throw new BusinessRuleError(
          'You do not have permission to cancel this appointment',
          'APPOINTMENT_CANCEL_FORBIDDEN',
        );
      }
    }
  }

  private async sendNotifications(
    appointment: Appointment,
    canceledBy: CancelationActor,
  ): Promise<void> {
    const [customer, provider, service] = await Promise.all([
      this.customerRepository.findById(appointment.customerId),
      this.userRepository.findById(appointment.providerId),
      this.serviceRepository.findById(appointment.serviceId),
    ]);

    if (!customer || !provider || !service) return;

    const emailParams = {
      customerEmail: customer.email,
      customerName: customer.name,
      providerEmail: provider.email,
      providerName: provider.name,
      serviceName: service.name,
      startsAt: appointment.startsAt,
      cancelReason: appointment.cancelReason ?? undefined,
    };

    if (canceledBy === 'CUSTOMER') {
      await this.emailGateway.sendAppointmentCancelledByCustomer(emailParams);

      this.notificationGateway.notifyProvider(appointment.providerId, {
        type: 'appointment.cancelled_by_customer',
        appointmentId: appointment.id,
        customerName: customer.name,
        serviceName: service.name,
        startsAt: appointment.startsAt,
        cancelReason: appointment.cancelReason ?? undefined,
      });
    } else {
      await this.emailGateway.sendAppointmentCancelledByProvider(emailParams);

      this.notificationGateway.notifyProvider(appointment.providerId, {
        type: 'appointment.cancelled_by_provider',
        appointmentId: appointment.id,
        customerName: customer.name,
        serviceName: service.name,
        startsAt: appointment.startsAt,
        cancelReason: appointment.cancelReason ?? undefined,
      });
    }
  }
}
