import z from 'zod';

export const baseServiceSchema = z.object({
  name: z
    .string()
    .min(2, 'The service name must have at least 2 characters')
    .max(100, 'The service name must have at most 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'The service description must have at most 500 characters')
    .optional(),
  durationInMinutes: z
    .number()
    .min(15, 'The service duration must be at least 15 minutes')
    .max(480, 'The service duration must be at most 480 minutes'),
  priceInCents: z
    .number()
    .int()
    .min(0, 'The service price must be at least 0 cents'),
  isActive: z.boolean().optional().default(true),
});

export const createServiceSchema = baseServiceSchema;

export type CreateServiceDTO = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = baseServiceSchema.partial();

export type UpdateServiceDTO = z.infer<typeof updateServiceSchema>;

export const serviceResponseSchema = baseServiceSchema.extend({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  durationInMinutes: z.number(),
  priceInCents: z.number(),
  isActive: z.boolean(),
  providerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ServiceResponseDTO = z.infer<typeof serviceResponseSchema>;

export const listServicesQuerySchema = z.object({
  providerId: z.string().uuid('Invalid provider ID').optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().trim().optional(),
});

export type ListServicesQueryDTO = z.infer<typeof listServicesQuerySchema>;
