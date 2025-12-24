import { Appointment } from '@/domain/entities/appointment';
import { Customer } from '@/domain/entities/customer';
import { BusinessRuleError } from '@/domain/errors';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { ICustomerRepository } from '@/domain/repositories/ICustomerRepository';

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

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly customerRepository: ICustomerRepository,
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

    return appointment;
  }
}
