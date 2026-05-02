import { ValidationError } from '../errors';
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
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  passwordHash: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
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
  private _primaryColor: string | null;
  private _secondaryColor: string | null;
  private _accentColor: string | null;
  private _passwordHash: string;
  private _passwordResetToken: string | null = null;
  private _passwordResetExpires: Date | null = null;

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

  private normalizeBrandColor(
    color: string | null | undefined,
    field: string,
  ): string | null {
    if (color === undefined || color === null || color.trim() === '') {
      return null;
    }

    const normalized = color.trim().toUpperCase();

    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
      throw new ValidationError(
        `${field} must be a valid HEX color`,
        'INVALID_BRAND_COLOR',
      );
    }

    return normalized;
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
    this._primaryColor = this.normalizeBrandColor(
      props.primaryColor,
      'Primary color',
    );
    this._secondaryColor = this.normalizeBrandColor(
      props.secondaryColor,
      'Secondary color',
    );
    this._accentColor = this.normalizeBrandColor(
      props.accentColor,
      'Accent color',
    );
    this._passwordHash = props.passwordHash;
    this._passwordResetToken = props.passwordResetToken ?? null;
    this._passwordResetExpires = props.passwordResetExpires ?? null;
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

  get primaryColor(): string | null {
    return this._primaryColor;
  }

  get secondaryColor(): string | null {
    return this._secondaryColor;
  }

  get accentColor(): string | null {
    return this._accentColor;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get passwordResetToken(): string | null {
    return this._passwordResetToken;
  }

  get passwordResetExpires(): Date | null {
    return this._passwordResetExpires;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  set passwordResetToken(token: string | null) {
    this._passwordResetToken = token;
  }

  set passwordResetExpires(expiration: Date | null) {
    this._passwordResetExpires = expiration;
  }

  updateProfile(name: string, email: string, phone?: string): void {
    this._name = this.validateName(name);
    this._email = Email.create(email.toLowerCase().trim());
    this._phone = phone ? Phone.create(phone) : null;
    this._updatedAt = new Date();
  }

  updateBusinessProfile(
    businessName: string,
    slug: string,
    branding?: {
      primaryColor?: string | null;
      secondaryColor?: string | null;
      accentColor?: string | null;
    },
  ): void {
    this._businessName = this.validateBusinessName(businessName);
    this._slug = Slug.create(slug);
    if (branding) {
      this._primaryColor = this.normalizeBrandColor(
        branding.primaryColor,
        'Primary color',
      );
      this._secondaryColor = this.normalizeBrandColor(
        branding.secondaryColor,
        'Secondary color',
      );
      this._accentColor = this.normalizeBrandColor(
        branding.accentColor,
        'Accent color',
      );
    }
    this._updatedAt = new Date();
  }

  updatePassword(newPasswordHash: string): void {
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }
}
