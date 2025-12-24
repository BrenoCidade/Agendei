import { ValidationError } from '../errors';

export class Phone {
  private readonly value: string;

  private constructor(phone: string) {
    this.value = phone;
  }

  static create(phone: string): Phone {
    const sanitized = this.sanitize(phone);

    if (!this.validate(sanitized)) {
      throw new ValidationError('Invalid phone number format', 'INVALID_PHONE');
    }

    return new Phone(sanitized);
  }

  static sanitize(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  static validate(phone: string): boolean {
    return phone.length >= 10 && phone.length <= 15;
  }

  get Value(): string {
    return this.value;
  }

  format(): string {
    if (this.value.length === 11) {
      return `(${this.value.slice(0, 2)}) ${this.value.slice(2, 7)}-${this.value.slice(7)}`;
    }
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
