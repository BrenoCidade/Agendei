import { ValidationError } from '../errors';

interface ServiceProps {
  id?: string;
  name: string;
  description?: string;
  durationInMinutes: number;
  priceInCents: number;
  providerId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Service {
  private _id: string;
  private _name: string;
  private _description: string | null;
  private _durationInMinutes: number;
  private _priceInCents: number;
  private _providerId: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ServiceProps) {
    const trimmedName = props.name.trim();
    if (trimmedName.length < 2) {
      throw new ValidationError(
        'Service name must have at least 2 characters',
        'INVALID_SERVICE_NAME',
      );
    }
    if (trimmedName.length > 100) {
      throw new ValidationError(
        'Service name must have at most 100 characters',
        'INVALID_SERVICE_NAME',
      );
    }

    if (props.description) {
      const trimmedDesc = props.description.trim();
      if (trimmedDesc.length > 500) {
        throw new ValidationError(
          'Description must have at most 500 characters',
          'INVALID_SERVICE_DESCRIPTION',
        );
      }
      this._description = trimmedDesc;
    } else {
      this._description = null;
    }

    if (props.durationInMinutes < 15) {
      throw new ValidationError(
        'Service duration must be at least 15 minutes',
        'INVALID_SERVICE_DURATION',
      );
    }
    if (props.durationInMinutes > 480) {
      throw new ValidationError(
        'Service duration must be at most 480 minutes (8 hours)',
        'INVALID_SERVICE_DURATION',
      );
    }

    if (props.priceInCents < 0) {
      throw new ValidationError(
        'Service price cannot be negative',
        'INVALID_SERVICE_PRICE',
      );
    }

    this._id = props.id ?? crypto.randomUUID();
    this._name = trimmedName;
    this._description = props.description?.trim() ?? null;
    this._durationInMinutes = props.durationInMinutes;
    this._priceInCents = props.priceInCents;
    this._providerId = props.providerId;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get durationInMinutes(): number {
    return this._durationInMinutes;
  }

  get priceInCents(): number {
    return this._priceInCents;
  }

  get providerId(): string {
    return this._providerId;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateDetails(
    name: string,
    description: string | null,
    durationInMinutes: number,
    priceInCents: number,
  ): void {
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 100) {
      throw new ValidationError(
        'Service name must have between 3 and 100 characters',
        'INVALID_SERVICE_NAME',
      );
    }

    if (description && description.trim().length > 500) {
      throw new ValidationError(
        'Description must have at most 500 characters',
        'INVALID_SERVICE_DESCRIPTION',
      );
    }

    if (durationInMinutes < 15 || durationInMinutes > 480) {
      throw new ValidationError(
        'Service duration must be between 15 and 480 minutes',
        'INVALID_SERVICE_DURATION',
      );
    }

    if (priceInCents < 0) {
      throw new ValidationError(
        'Service price cannot be negative',
        'INVALID_SERVICE_PRICE',
      );
    }

    this._name = trimmedName;
    this._description = description ? description.trim() : null;
    this._durationInMinutes = durationInMinutes;
    this._priceInCents = priceInCents;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
