import { BusinessRuleError, ValidationError } from '../errors';

export interface TimeSlot {
  start: string;
  end: string;
}

interface AvailabilityProps {
  id?: string;
  providerId: string;
  dayOfWeek: number;
  slots: TimeSlot[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Availability {
  private _id: string;
  private _providerId: string;
  private _dayOfWeek: number;
  private _slots: TimeSlot[];
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private validateDayOfWeek(dayOfWeek: number) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ValidationError(
        'Day of week must be between 0 (Sunday) and 6 (Saturday)',
        'INVALID_DAY_OF_WEEK',
      );
    }
    return dayOfWeek;
  }

  private validateTimeFormat(time: string) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  private validateTimeSlots(slot: TimeSlot) {
    if (!this.validateTimeFormat(slot.start)) {
      throw new ValidationError(
        `Invalid start time format: ${slot.start}. Use HH:MM`,
        'INVALID_TIME_FORMAT',
      );
    }

    if (!this.validateTimeFormat(slot.end)) {
      throw new ValidationError(
        `Invalid end time format: ${slot.end}. Use HH:MM`,
        'INVALID_TIME_FORMAT',
      );
    }

    const startMinutes = this.timeToMinutes(slot.start);
    const endMinutes = this.timeToMinutes(slot.end);

    if (endMinutes <= startMinutes) {
      throw new ValidationError(
        `End time (${slot.end}) must be after start time (${slot.start})`,
        'INVALID_TIME_RANGE',
      );
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
      throw new ValidationError(
        'Time slot duration must be at least 15 minutes',
        'INVALID_SLOT_DURATION',
      );
    }
  }

  private validateSlots(slots: TimeSlot[]) {
    if (slots.length === 0) {
      throw new ValidationError(
        'At least one time slot is required',
        'NO_TIME_SLOTS',
      );
    }

    for (const slot of slots) {
      this.validateTimeSlots(slot);
    }

    const sortedSlots = [...slots].sort((a, b) => {
      return this.timeToMinutes(a.start) - this.timeToMinutes(b.start);
    });

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const currentSlot = sortedSlots[i];
      const nextSlot = sortedSlots[i + 1];

      const currentEnd = this.timeToMinutes(currentSlot.end);
      const nextStart = this.timeToMinutes(nextSlot.start);

      if (nextStart < currentEnd) {
        throw new BusinessRuleError(
          `Time slots overlap: ${currentSlot.start}-${currentSlot.end} and ${nextSlot.start}-${nextSlot.end}`,
          'SLOTS_OVERLAP',
        );
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  constructor(props: AvailabilityProps) {
    const validatedDayOfWeek = this.validateDayOfWeek(props.dayOfWeek);

    this.validateSlots(props.slots);

    this._id = props.id ?? crypto.randomUUID();
    this._providerId = props.providerId;
    this._dayOfWeek = validatedDayOfWeek;
    this._slots = props.slots.map((slot) => ({ ...slot }));
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get providerId(): string {
    return this._providerId;
  }

  get dayOfWeek(): number {
    return this._dayOfWeek;
  }

  get slots(): TimeSlot[] {
    return this._slots.map((slot) => ({ ...slot }));
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

  updateSlots(newSlots: TimeSlot[]): void {
    this.validateSlots(newSlots);

    this._slots = newSlots.map((slot) => ({ ...slot }));

    this._updatedAt = new Date();
  }

  activate(): void {
    if (this._isActive) {
      throw new BusinessRuleError(
        'Availability is already active',
        'AVAILABILITY_ALREADY_ACTIVE',
      );
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    if (!this._isActive) {
      throw new BusinessRuleError(
        'Availability is already inactive',
        'AVAILABILITY_ALREADY_INACTIVE',
      );
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  isTimeAvailable(time: string): boolean {
    if (!this.validateTimeFormat(time)) {
      return false;
    }

    const timeInMinutes = this.timeToMinutes(time);

    return this._slots.some((slot) => {
      const slotStart = this.timeToMinutes(slot.start);
      const slotEnd = this.timeToMinutes(slot.end);

      return timeInMinutes >= slotStart && timeInMinutes < slotEnd;
    });
  }

  getDayName(): string {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    return days[this._dayOfWeek];
  }
}
