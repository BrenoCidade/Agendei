import { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockEmailGateway implements IEmailGateway {
  private readonly logger = new Logger(MockEmailGateway.name);

  async sendRecoveryEmail(to: string, _token: string): Promise<void> {
    this.logger.log(`Mock recovery email sent to ${to}`);
    return Promise.resolve();
  }
}
