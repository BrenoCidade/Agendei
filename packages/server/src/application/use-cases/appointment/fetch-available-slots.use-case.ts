import { NotFoundError, BusinessRuleError } from '@/domain/errors';
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository';
import type { IServiceRepository } from '@/domain/repositories/IServiceRepository';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { Appointment } from '@/domain/entities/appointment';
import { Inject, Injectable } from '@nestjs/common';

interface FetchAvailableSlotsInput {
  providerId: string;
  serviceId: string;
  date: Date;
}

@Injectable()
export class FetchAvailableSlotsUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IServiceRepository')
    private readonly serviceRepository: IServiceRepository,
    @Inject('IAvailabilityRepository')
    private readonly availabilityRepository: IAvailabilityRepository,
    @Inject('IAppointmentRepository')
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(input: FetchAvailableSlotsInput): Promise<string[]> {
    const provider = await this.userRepository.findById(input.providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    const service = await this.serviceRepository.findById(input.serviceId);
    if (!service) {
      throw new NotFoundError('Service not found', 'SERVICE_NOT_FOUND');
    }

    if (service.providerId !== input.providerId) {
      throw new BusinessRuleError(
        'Service does not belong to this provider',
        'SERVICE_PROVIDER_MISMATCH',
      );
    }

    if (!service.isActive) {
      throw new BusinessRuleError('Service is not active', 'SERVICE_INACTIVE');
    }

    const dayOfWeek = input.date.getUTCDay();
    const availability =
      await this.availabilityRepository.findByProviderIdAndDay(
        input.providerId,
        dayOfWeek,
      );

    if (!availability || !availability.isActive) {
      return [];
    }

    const startOfDay = new Date(input.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(input.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointments =
      await this.appointmentRepository.findByProviderAndDateRange(
        input.providerId,
        startOfDay,
        endOfDay,
      );

    const allPossibleSlots = this.generateAllSlots(
      availability.slots,
      service.durationInMinutes,
    );

    const availableSlots = this.filterOccupiedSlots(
      allPossibleSlots,
      appointments,
      input.date,
      service.durationInMinutes,
    );

    const now = new Date();
    const futureSlots = availableSlots.filter((slot) => {
      const slotDateTime = this.parseSlotToDateTime(slot, input.date);
      return slotDateTime > now;
    });

    return futureSlots.sort();
  }

  private generateAllSlots(
    timeSlots: { start: string; end: string }[],
    serviceDuration: number,
  ): string[] {
    const slots: string[] = [];
    const slotInterval = 30;

    for (const timeSlot of timeSlots) {
      const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
      const [endHour, endMinute] = timeSlot.end.split(':').map(Number);

      let currentMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      while (currentMinutes + serviceDuration <= endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(formattedTime);
        currentMinutes += slotInterval;
      }
    }

    return slots;
  }

  private filterOccupiedSlots(
    allSlots: string[],
    appointments: Appointment[],
    date: Date,
    serviceDuration: number,
  ): string[] {
    return allSlots.filter((slot) => {
      const slotStart = this.parseSlotToDateTime(slot, date);
      const slotEnd = new Date(
        slotStart.getTime() + serviceDuration * 60 * 1000,
      );

      const hasConflict = appointments.some((appointment) => {
        return (
          (slotStart >= appointment.startsAt &&
            slotStart < appointment.endsAt) ||
          (slotEnd > appointment.startsAt && slotEnd <= appointment.endsAt) ||
          (slotStart <= appointment.startsAt && slotEnd >= appointment.endsAt)
        );
      });

      return !hasConflict;
    });
  }

  private parseSlotToDateTime(slot: string, baseDate: Date): Date {
    const [hour, minute] = slot.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hour, minute, 0, 0);
    return date;
  }
}
