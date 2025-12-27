export interface IEmailGateway {
  sendRecoveryEmail(to: string, token: string): Promise<void>;
}
