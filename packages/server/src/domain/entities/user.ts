import { ValidationError } from '../errors';
import { PasswordService } from '../services/password.service';
import { Email } from '../value-objects/email';
import { Phone } from '../value-objects/phone';
import { Slug } from '../value-objects/slug';

interface UserProps {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  slug?: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private _id: string;
  private _name: string;
  private _email: Email;
  private _phone: Phone | null;
  private _businessName: string;
  private _slug: Slug;
  private _passwordHash: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private validateName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      throw new ValidationError(
        'Name must have at least 2 characters',
        'INVALID_NAME',
      );
    }
    return trimmed;
  }

  private validateBusinessName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      throw new ValidationError(
        'Business name must have at least 3 characters',
        'INVALID_BUSINESS_NAME',
      );
    }
    if (trimmed.length > 100) {
      throw new ValidationError(
        'Business name must have at most 100 characters',
        'INVALID_BUSINESS_NAME',
      );
    }
    return trimmed;
  }

  constructor(props: UserProps) {
    this._id = props.id ?? crypto.randomUUID();
    this._name = this.validateName(props.name);
    this._email = Email.create(props.email.toLowerCase().trim());
    this._phone = props.phone ? Phone.create(props.phone) : null;
    this._businessName = this.validateBusinessName(props.businessName);
    this._slug = props.slug
      ? Slug.create(props.slug)
      : Slug.generate(props.businessName);
    this._passwordHash = props.passwordHash;
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

  get phone(): string | null {
    return this._phone?.Value || null;
  }

  get businessName(): string {
    return this._businessName;
  }

  get slug(): string {
    return this._slug.Value;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  validatePassword(plainPassword: string): boolean {
    return PasswordService.compare(plainPassword, this._passwordHash);
  }

  updateProfile(name: string, email: string, phone?: string): void {
    this._name = this.validateName(name);
    this._email = Email.create(email.toLowerCase().trim());
    this._phone = phone ? Phone.create(phone) : null;
    this._updatedAt = new Date();
  }

  updatePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }
}
