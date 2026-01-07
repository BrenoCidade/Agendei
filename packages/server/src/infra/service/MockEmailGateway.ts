import { IEmailGateway } from '@/domain/gateways/IEmailGateway';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockEmailGateway implements IEmailGateway {
  async sendRecoveryEmail(to: string, token: string): Promise<void> {
    console.log('------- MOCK EMAIL SENT -------');
    console.log(`Recipient: ${to}`);
    console.log(`Subject: Password Recovery`);
    console.log('Body:');
    console.log(`Use this token to reset your password: ${token}`);
    console.log('-----------------------------');

    return Promise.resolve();
  }
}
