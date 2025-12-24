import { z } from 'zod';

export const AppointmentStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const CancelationActorSchema = z.enum([
  'CUSTOMER',
  'PROVIDER',
  'SYSTEM',
]);
export type CancelationActor = z.infer<typeof CancelationActorSchema>;

export const baseAppointmentSchema = z.object({
  customerId: z.string().uuid('invalid customer ID'),
  providerId: z.string().uuid('invalid provider ID'),
  serviceId: z.string().uuid('invalid service ID'),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  observation: z.string().max(500).trim().optional(),
});

export const createAppointmentSchema = baseAppointmentSchema
  .refine(
    (data) => {
      const start = new Date(data.startsAt);
      const end = new Date(data.endsAt);
      return start < end;
    },
    {
      message: 'The start date must be before the end date',
      path: ['endsAt'],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startsAt);
      const now = new Date();
      const minimumAdvance = new Date(now.getTime() + 60 * 60 * 1000);
      return start >= minimumAdvance;
    },
    {
      message: 'The start date must be at least 1 hour in the future',
      path: ['startsAt'],
    },
  )
  .refine(
    (data) => {
      const start = new Date(data.startsAt);
      const end = new Date(data.endsAt);
      const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return durationInMinutes >= 15;
    },
    {
      message: 'The appointment duration must be at least 15 minutes',
      path: ['endsAt'],
    },
  );

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = baseAppointmentSchema
  .omit({ customerId: true, providerId: true })
  .partial()
  .extend({
    status: AppointmentStatusSchema.optional(),
  });

export type UpdateAppointmentDTO = z.infer<typeof updateAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
  reason: z
    .string()
    .min(10, 'The reason must be at least 10 characters long')
    .max(500, 'The reason must be at most 500 characters long'),
  canceledBy: CancelationActorSchema,
});

export type CancelAppointmentDTO = z.infer<typeof cancelAppointmentSchema>;

export const appointmentResponseSchema = baseAppointmentSchema.extend({
  id: z.string().uuid(),
  status: AppointmentStatusSchema,
  cancelReason: z.string().nullable(),
  canceledBy: CancelationActorSchema.nullable(),
  canceledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  durationInMinutes: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
});

export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;
