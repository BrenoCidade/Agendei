import { Availability } from '@/domain/entities/availability';
import { Prisma, Availability as PrismaAvailability } from '@prisma/client';

type AvailabilityPrismaData = {
  id: string;
  providerId: string;
  dayOfWeek: number;
  slots: Prisma.InputJsonValue;
  isActive: boolean;
};

export class PrismaAvailabilityMapper {
  private static slotsToJson(
    slots: Array<{ start: string; end: string }>,
  ): Prisma.InputJsonValue {
    return slots as Prisma.InputJsonValue;
  }

  private static jsonToSlots(
    jsonSlots: Prisma.JsonValue,
  ): Array<{ start: string; end: string }> {
    if (!jsonSlots) {
      return [];
    }

    if (!Array.isArray(jsonSlots)) {
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

  static toPrisma(availability: Availability): AvailabilityPrismaData {
    return {
      id: availability.id,
      providerId: availability.providerId,
      dayOfWeek: availability.dayOfWeek,
      slots: this.slotsToJson(availability.slots),
      isActive: availability.isActive,
    };
  }
}
