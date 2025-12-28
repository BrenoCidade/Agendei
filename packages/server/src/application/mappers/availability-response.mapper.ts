import { AvailabilityResponseDTO } from '@saas/shared';
import { Availability } from '@/domain/entities/availability';

export class AvailabilityResponseMapper {
  static toDTO(availability: Availability): AvailabilityResponseDTO {
    return {
      id: availability.id,
      dayOfWeek: availability.dayOfWeek,
      slots: availability.slots.map((slot) => ({
        start: slot.start,
        end: slot.end,
      })),
      isActive: availability.isActive,
      providerId: availability.providerId,
      createdAt: availability.createdAt.toISOString(),
      updatedAt: availability.updatedAt.toISOString(),
    };
  }
}
