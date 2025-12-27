import type { AppointmentStatus, CancelationActor } from '@saas/shared';
import { ValidationError, BusinessRuleError } from '../errors';

interface AppointmentProps {
  id?: string;
  customerId: string;
  serviceId: string;
  providerId: string;
  startsAt: Date;
  endsAt: Date;
  status?: AppointmentStatus;
  observation?: string;
  cancelReason: string | null;
  canceledBy: CancelationActor | null;
  canceledAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Appointment {
  private _id: string;
  private _customerId: string;
  private _serviceId: string;
  private _providerId: string;
  private _startsAt: Date;
  private _endsAt: Date;
  private _status: AppointmentStatus;
  private _observation?: string;
  private _cancelReason: string | null;
  private _canceledBy: CancelationActor | null;
  private _canceledAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AppointmentProps) {
    if (props.startsAt < new Date()) {
      throw new ValidationError(
        'Cannot schedule appointments in the past',
        'APPOINTMENT_PAST_DATE',
      );
    }

    if (props.endsAt <= props.startsAt) {
      throw new ValidationError(
        'End time must be after start time',
        'APPOINTMENT_INVALID_TIME_RANGE',
      );
    }

    const durationInMinutes =
      (props.endsAt.getTime() - props.startsAt.getTime()) / (1000 * 60);
    if (durationInMinutes < 15) {
      throw new ValidationError(
        'Appointment duration must be at least 15 minutes',
        'APPOINTMENT_MIN_DURATION',
      );
    }

    this._id = props.id ?? crypto.randomUUID();
    this._customerId = props.customerId;
    this._serviceId = props.serviceId;
    this._providerId = props.providerId;
    this._startsAt = props.startsAt;
    this._endsAt = props.endsAt;
    this._status = props.status ?? 'PENDING';
    this._observation = props.observation;
    this._cancelReason = props.cancelReason;
    this._canceledBy = props.canceledBy;
    this._canceledAt = props.canceledAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }
  get customerId(): string {
    return this._customerId;
  }
  get serviceId(): string {
    return this._serviceId;
  }
  get providerId(): string {
    return this._providerId;
  }
  get startsAt(): Date {
    return this._startsAt;
  }
  get endsAt(): Date {
    return this._endsAt;
  }
  get status(): AppointmentStatus {
    return this._status;
  }
  get observation(): string | undefined {
    return this._observation;
  }
  get cancelReason(): string | null {
    return this._cancelReason;
  }
  get canceledBy(): CancelationActor | null {
    return this._canceledBy;
  }
  get canceledAt(): Date | null {
    return this._canceledAt;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  cancel(reason: string, actor: CancelationActor): void {
    if (this._status === 'CANCELLED') {
      throw new BusinessRuleError(
        'Appointment is already cancelled',
        'APPOINTMENT_ALREADY_CANCELLED',
      );
    }

    if (this._status === 'COMPLETED') {
      throw new BusinessRuleError(
        'Cannot cancel a completed appointment',
        'APPOINTMENT_ALREADY_COMPLETED',
      );
    }

    this._status = 'CANCELLED';
    this._cancelReason = reason;
    this._canceledBy = actor;
    this._canceledAt = new Date();
    this._updatedAt = new Date();
  }

  confirm(): void {
    if (this._status !== 'PENDING') {
      throw new BusinessRuleError(
        'Only pending appointments can be confirmed',
        'APPOINTMENT_NOT_PENDING',
      );
    }
    this._status = 'CONFIRMED';
    this._updatedAt = new Date();
  }

  markAsNoShow(): void {
    if (this._status !== 'CONFIRMED') {
      throw new BusinessRuleError(
        'Only confirmed appointments can be marked as no-show',
        'APPOINTMENT_NOT_CONFIRMED',
      );
    }
    this._status = 'NO_SHOW';
    this._updatedAt = new Date();
  }

  complete(): void {
    if (this._status !== 'CONFIRMED') {
      throw new BusinessRuleError(
        'Only confirmed appointments can be completed',
        'APPOINTMENT_NOT_CONFIRMED',
      );
    }
    this._status = 'COMPLETED';
    this._updatedAt = new Date();
  }

  ensureOwnedBy(userId: string): void {
    if (this._providerId !== userId) {
      throw new BusinessRuleError(
        'You do not have permission to modify this appointment',
        'APPOINTMENT_ACCESS_FORBIDDEN',
      );
    }
  }
}
