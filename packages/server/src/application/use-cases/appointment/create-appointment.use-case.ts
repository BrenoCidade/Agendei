import { Appointment } from '@/domain/entities/appointment';
import { Customer } from '@/domain/entities/customer';
import { BusinessRuleError } from '@/domain/errors';
import type { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import type { INotificationGateway } from '@/domain/gateways/INotificationGateway';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import type { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable, Logger } from '@nestjs/common';

interface CreateAppointmentInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  providerId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  observation?: string;
}

@Injectable()
export class CreateAppointmentUseCase {
  private readonly logger = new Logger(CreateAppointmentUseCase.name);

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

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    let customer = await this.customerRepository.findByEmailAndProvider(
      input.customerEmail,
      input.providerId,
    );

    if (!customer) {
      customer = new Customer({
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
        providerId: input.providerId,
      });

      await this.customerRepository.save(customer);
    }

    const overlapping = await this.appointmentRepository.findOverlapping(
      input.providerId,
      input.startsAt,
      input.endsAt,
    );

    if (overlapping) {
      throw new BusinessRuleError(
        'Time slot is already booked',
        'APPOINTMENT_CONFLICT',
      );
    }

    const appointment = new Appointment({
      customerId: customer.id,
      serviceId: input.serviceId,
      providerId: input.providerId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      observation: input.observation,
      cancelReason: null,
      canceledBy: null,
      canceledAt: null,
    });

    await this.appointmentRepository.save(appointment);

    this.sendNotifications(appointment, input.customerName, input.customerEmail).catch(
      (err: unknown) => this.logger.error('Failed to send appointment notifications', err),
    );

    return appointment;
  }

  private async sendNotifications(
    appointment: Appointment,
    customerName: string,
    customerEmail: string,
  ): Promise<void> {
    const [provider, service] = await Promise.all([
      this.userRepository.findById(appointment.providerId),
      this.serviceRepository.findById(appointment.serviceId),
    ]);

    if (!provider || !service) return;

    const emailParams = {
      customerEmail,
      customerName,
      providerEmail: provider.email,
      providerName: provider.name,
      serviceName: service.name,
      startsAt: appointment.startsAt,
    };

    await Promise.all([
      this.emailGateway.sendAppointmentCreatedToCustomer(emailParams),
      this.emailGateway.sendAppointmentCreatedToProvider(emailParams),
    ]);

    this.notificationGateway.notifyProvider(appointment.providerId, {
      type: 'appointment.created',
      appointmentId: appointment.id,
      customerName,
      serviceName: service.name,
      startsAt: appointment.startsAt,
    });
  }
}
