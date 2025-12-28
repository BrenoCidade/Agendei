import { Availability } from '@/domain/entities/availability';
import { Prisma, Availability as PrismaAvailability } from '@prisma/client';

export class PrismaAvailabilityMapper {
  private static slotsToJson(
    slots: Array<{ start: string; end: string }>,
  ): Prisma.JsonValue {
    return JSON.parse(JSON.stringify(slots)) as Prisma.JsonValue;
  }

  private static jsonToSlots(
    jsonSlots: Prisma.JsonValue,
  ): Array<{ start: string; end: string }> {
    if (!jsonSlots) {
      return [];
    }

    if (!Array.isArray(jsonSlots)) {
      console.warn('Invalid slots format, returning empty array');
      return [];
    }

    return jsonSlots as Array<{ start: string; end: string }>;
  }

  static toDomain(raw: PrismaAvailability): Availability {
    const slots = this.jsonToSlots(raw.slots);

    return new Availability({
      id: raw.id,
      providerId: raw.providerId,
      dayOfWeek: raw.dayOfWeek,
      slots: slots,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(
    availability: Availability,
  ): Omit<PrismaAvailability, 'createdAt' | 'updatedAt'> {
    return {
      id: availability.id,
      providerId: availability.providerId,
      dayOfWeek: availability.dayOfWeek,
      slots: this.slotsToJson(availability.slots),
      isActive: availability.isActive,
    };
  }
}
