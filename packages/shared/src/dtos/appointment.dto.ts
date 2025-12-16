import { z } from 'zod';

export const AppointmentStatus = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']);
export type AppointmentStatus = z.infer<typeof AppointmentStatus>;

export const CancelationActor = z.enum(['CUSTOMER', 'PROVIDER', 'SYSTEM']);
export type CancelationActor = z.infer<typeof CancelationActor>;

export const baseAppointmentSchema = z.object({
    customerId: z.string().uuid("ID do cliente inválido"),
    providerId: z.string().uuid("ID do prestador inválido"),
    serviceId: z.string().uuid("ID do serviço inválido"),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    observation: z.string().max(500).trim().optional(),
});

export const createAppointmentSchema = baseAppointmentSchema
    .refine((data) => {
        const start = new Date(data.startsAt);
        const end = new Date(data.endsAt);
        return start < end;
    },
        {
            message: "A data de início deve ser anterior à data de término",
            path: ["endsAt"],
        }
    )
    .refine((data) => {
        const start = new Date(data.startsAt);
        const now = new Date();
        const minimumAdvance = new Date(now.getTime() + 60 * 60 * 1000);
        return start >= minimumAdvance;
    },
        {
            message: "A data de início deve ser pelo menos 1 hora no futuro",
            path: ["startsAt"],
        }
    )
    .refine((data) => {
        const start = new Date(data.startsAt);
        const end = new Date(data.endsAt);
        const durationInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return durationInMinutes >= 15;
    },
        {
            message: "A duração do compromisso deve ser de pelo menos 15 minutos",
            path: ["endsAt"],
        }
    )

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = baseAppointmentSchema
    .omit({ customerId: true, providerId: true })
    .partial()
    .extend({
        status: AppointmentStatus.optional(),
    });

export type UpdateAppointmentDTO = z.infer<typeof updateAppointmentSchema>;

export const cancelAppointmentSchema = z.object({
    reason: z.string().min(10, "A razão deve ter no mínimo 10 caracteres").max(500, "A razão deve ter no máximo 500 caracteres"),
    canceledBy: CancelationActor,
});

export type CancelAppointmentDTO = z.infer<typeof cancelAppointmentSchema>;

export const appointmentResponseSchema = baseAppointmentSchema.extend({
    id: z.string().uuid(),
    status: AppointmentStatus,
    cancelReason: z.string().nullable().optional(),
    canceledBy: z.enum(['CUSTOMER', 'PROVIDER', 'SYSTEM']).nullable(),
    canceledAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    durationInMinutes: z.number().int().positive().optional(),
    price: z.number().positive().optional(),
});

export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;