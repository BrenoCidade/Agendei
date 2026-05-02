import { CreateAppointmentUseCase } from '../../../../src/application/use-cases/appointment/create-appointment.use-case';
import { Customer } from '../../../../src/domain/entities/customer';
import type { IEmailGateway } from '../../../../src/domain/gateways/IEmailGateway';
import type { INotificationGateway } from '../../../../src/domain/gateways/INotificationGateway';
import { InMemoryAppointmentRepository } from '../../../repositories/in-memory-appointment.repository';
import { InMemoryCustomerRepository } from '../../../repositories/in-memory-customer.repository';
import { InMemoryServiceRepository } from '../../../repositories/in-memory-service.repository';
import { InMemoryUserRepository } from '../../../repositories/in-memory-user.repository';

const mockEmailGateway: IEmailGateway = {
  sendRecoveryEmail: jest.fn(),
  sendAppointmentCreatedToCustomer: jest.fn(),
  sendAppointmentCreatedToProvider: jest.fn(),
  sendAppointmentCancelledByCustomer: jest.fn(),
  sendAppointmentCancelledByProvider: jest.fn(),
};

const mockNotificationGateway: INotificationGateway = {
  notifyProvider: jest.fn(),
};

describe('CreateAppointmentUseCase', () => {
  let appointmentRepository: InMemoryAppointmentRepository;
  let customerRepository: InMemoryCustomerRepository;
  let userRepository: InMemoryUserRepository;
  let serviceRepository: InMemoryServiceRepository;
  let createAppointmentUseCase: CreateAppointmentUseCase;

  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    customerRepository = new InMemoryCustomerRepository();
    userRepository = new InMemoryUserRepository();
    serviceRepository = new InMemoryServiceRepository();
    createAppointmentUseCase = new CreateAppointmentUseCase(
      appointmentRepository,
      customerRepository,
      userRepository,
      serviceRepository,
      mockEmailGateway,
      mockNotificationGateway,
    );
  });

  it('should create appointment with new customer', async () => {
    const providerId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const input = {
      customerName: 'João Silva',
      customerEmail: 'joao@email.com',
      customerPhone: '11999998888',
      providerId,
      serviceId,
      startsAt,
      endsAt,
      observation: 'Corte de cabelo',
    };

    const appointment = await createAppointmentUseCase.execute(input);

    expect(appointment.id).toBeDefined();
    expect(appointment.customerId).toBeDefined();
    expect(appointment.serviceId).toBe(serviceId);
    expect(appointment.providerId).toBe(providerId);
    expect(appointment.status).toBe('PENDING');
    expect(customerRepository.customers).toHaveLength(1);
    expect(appointmentRepository.appointments).toHaveLength(1);
  });

  it('should reuse existing customer by email', async () => {
    const providerId = crypto.randomUUID();

    const existingCustomer = new Customer({
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999998888',
      providerId,
    });

    await customerRepository.save(existingCustomer);

    const serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const input = {
      customerName: 'João Silva',
      customerEmail: 'joao@email.com',
      customerPhone: '11999998888',
      providerId,
      serviceId,
      startsAt,
      endsAt,
    };

    const appointment = await createAppointmentUseCase.execute(input);

    expect(appointment.customerId).toBe(existingCustomer.id);
    expect(customerRepository.customers).toHaveLength(1);
  });

  it('should throw error for overlapping appointments', async () => {
    const providerId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const firstInput = {
      customerName: 'João Silva',
      customerEmail: 'joao@email.com',
      customerPhone: '11999998888',
      providerId,
      serviceId,
      startsAt,
      endsAt,
    };

    await createAppointmentUseCase.execute(firstInput);

    const secondInput = {
      customerName: 'Maria Silva',
      customerEmail: 'maria@email.com',
      customerPhone: '11888887777',
      providerId,
      serviceId,
      startsAt,
      endsAt,
    };

    await expect(createAppointmentUseCase.execute(secondInput)).rejects.toThrow(
      'Time slot is already booked',
    );
  });

  it('should normalize customer email', async () => {
    const providerId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const input = {
      customerName: 'João Silva',
      customerEmail: 'JOAO@EMAIL.COM',
      customerPhone: '11999998888',
      providerId,
      serviceId,
      startsAt,
      endsAt,
    };

    const appointment = await createAppointmentUseCase.execute(input);

    const customer = await customerRepository.findById(appointment.customerId);
    expect(customer?.email).toBe('joao@email.com');
  });

  it('should sanitize customer phone', async () => {
    const providerId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);

    const input = {
      customerName: 'João Silva',
      customerEmail: 'joao@email.com',
      customerPhone: '(11) 99999-8888',
      providerId,
      serviceId,
      startsAt,
      endsAt,
    };

    const appointment = await createAppointmentUseCase.execute(input);

    const customer = await customerRepository.findById(appointment.customerId);
    expect(customer?.phone).toBe('11999998888');
  });
});
