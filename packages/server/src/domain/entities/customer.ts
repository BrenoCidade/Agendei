import { Email } from '../value-objects/email';
import { Phone } from '../value-objects/phone';

interface CustomerProps {
  id?: string;
  name: string;
  email: string;
  phone: string;
  providerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  private _id: string;
  private _name: string;
  private _email: Email;
  private _phone: Phone;
  private _providerId: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new Error('Name must have at least 2 characters');
    }
    return trimmed;
  }

  constructor(props: CustomerProps) {
    this._id = props.id ?? crypto.randomUUID();
    this._name = this.validateName(props.name);
    this._email = Email.create(props.email.toLowerCase().trim());
    this._phone = Phone.create(props.phone);
    this._providerId = props.providerId;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email.Value;
  }

  get phone(): string {
    return this._phone.Value;
  }

  get providerId(): string {
    return this._providerId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateContactInfo(name: string, email: string, phone: string) {
    this._name = this.validateName(name);
    this._email = Email.create(email.toLocaleLowerCase().trim());
    this._phone = Phone.create(phone);
    this._updatedAt = new Date();
  }

  ensureOwnedBy(userId: string): void {
    if (this._providerId !== userId) {
      throw new Error('You do not have permission to modify this customer');
    }
  }
}
