import z from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const baseAvailabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  isActive: z.boolean().default(true),
});

export const timeSlotSchema = z
  .object({
    start: z.string().regex(TIME_REGEX, 'Start time must be HH:MM'),
    end: z.string().regex(TIME_REGEX, 'End time must be HH:MM'),
  })
  .refine(
    (data) => {
      const start = timeToMinutes(data.start);
      const end = timeToMinutes(data.end);
      return end > start;
    },
    {
      message: 'End time must be after start time',
      path: ['end'],
    },
  )
  .refine(
    (data) => {
      const start = timeToMinutes(data.start);
      const end = timeToMinutes(data.end);
      return end - start >= 15;
    },
    {
      message: 'Slot must be at least 15 minutes',
      path: ['end'],
    },
  );

export type TimeSlotDTO = z.infer<typeof timeSlotSchema>;

export const setAvailabilitySchema = baseAvailabilitySchema.extend({
  slots: z
    .array(timeSlotSchema)
    .min(1, 'At least one time slot is required if day is active')
    .superRefine((slots, ctx) => {
      const sortedSlots = [...slots].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
      );

      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        if (timeToMinutes(current.end) > timeToMinutes(next.start)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Overlapping slots detected: ${current.start}-${current.end} overlaps with ${next.start}-${next.end}`,
            path: [i + 1, 'start'],
          });
        }
      }
    }),
});

export type SetAvailabilityDTO = z.infer<typeof setAvailabilitySchema>;

export const setWeekAvailabilitySchema = z.object({
  availabilities: z.array(setAvailabilitySchema),
});

export type SetWeekAvailabilityDTO = z.infer<typeof setWeekAvailabilitySchema>;

export const fetchAvailableSlotsSchema = z.object({
  date: z.string().date(),
  serviceId: z.string().uuid(),
});

export type FetchAvailableSlotsDTO = z.infer<typeof fetchAvailableSlotsSchema>;

export const availabilityResponseSchema = baseAvailabilitySchema.extend({
  id: z.string().uuid(),
  providerId: z.string().uuid(),
  slots: z.array(timeSlotSchema),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type AvailabilityResponseDTO = z.infer<
  typeof availabilityResponseSchema
>;

export const availableSlotsResponseSchema = z.object({
  date: z.string(),
  slots: z.array(z.string().regex(TIME_REGEX)),
});

export type AvailableSlotsResponseDTO = z.infer<
  typeof availableSlotsResponseSchema
>;
