import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Inject, Injectable } from '@nestjs/common';

interface DeleteServiceInput {
  serviceId: string;
  providerId: string;
}

@Injectable()
export class DeleteServiceUseCase {
  constructor(
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(input: DeleteServiceInput): Promise<void> {
    const service = await this.serviceRepository.findById(input.serviceId);

    if (!service) {
      throw new NotFoundError('Service not found', 'SERVICE_NOT_FOUND');
    }

    if (service.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'You do not have permission to delete this service',
        'SERVICE_DELETE_FORBIDDEN',
      );
    }

    const hasAppointments = await this.appointmentRepository.existsByServiceId(
      input.serviceId,
    );

    if (hasAppointments) {
      service.deactivate();
      await this.serviceRepository.save(service);
    } else {
      await this.serviceRepository.delete(input.serviceId);
    }
  }
}
