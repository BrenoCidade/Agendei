import type { AppointmentEmailParams, IEmailGateway } from '@/domain/gateways/IEmailGateway';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockEmailGateway implements IEmailGateway {
  private readonly logger = new Logger(MockEmailGateway.name);

  async sendRecoveryEmail(to: string, _token: string): Promise<void> {
    this.logger.log(`[Mock] Recovery email → ${to}`);
  }

  async sendAppointmentCreatedToCustomer(params: AppointmentEmailParams): Promise<void> {
    this.logger.log(`[Mock] Appointment created (customer) → ${params.customerEmail}`);
  }

  async sendAppointmentCreatedToProvider(params: AppointmentEmailParams): Promise<void> {
    this.logger.log(`[Mock] Appointment created (provider) → ${params.providerEmail}`);
  }

  async sendAppointmentCancelledByCustomer(params: AppointmentEmailParams): Promise<void> {
    this.logger.log(`[Mock] Appointment cancelled by customer → ${params.providerEmail}`);
  }

  async sendAppointmentCancelledByProvider(params: AppointmentEmailParams): Promise<void> {
    this.logger.log(`[Mock] Appointment cancelled by provider → ${params.customerEmail}`);
  }
}
