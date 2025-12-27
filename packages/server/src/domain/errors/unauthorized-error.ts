import { DomainError } from './domain-error';

export class UnauthorizedError extends DomainError {
  constructor(message: string, code: string) {
    super(message, code);
    this.name = 'UnauthorizedError';
  }
}
