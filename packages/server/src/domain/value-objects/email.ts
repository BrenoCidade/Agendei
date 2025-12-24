import { ValidationError } from '../errors';

export class Email {
  private readonly value: string;

  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(email: string) {
    this.value = email;
  }

  static create(email: string): Email {
    if (!this.validate(email)) {
      throw new ValidationError('Invalid email format', 'INVALID_EMAIL');
    }
    return new Email(email);
  }

  static validate(email: string): boolean {
    if (!email) return false;

    if (email.length > 255) return false;

    return this.emailRegex.test(email);
  }

  get Value(): string {
    return this.value;
  }
}
