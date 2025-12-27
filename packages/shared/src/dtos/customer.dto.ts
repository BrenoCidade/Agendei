import { z } from 'zod';

export const baseCustomerSchema = z.object({
  name: z
    .string()
    .min(2, 'The name must have at least 2 characters')
    .max(50, 'The name must have at most 50 characters')
    .trim(),
  email: z.string().email('Invalid email').trim(),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,15}$/, 'Invalid phone number')),
  providerId: z.string().uuid('Invalid provider ID'),
});

export const createCustomerSchema = baseCustomerSchema;

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = baseCustomerSchema
  .omit({ providerId: true })
  .partial();

export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;

export const customerResponseSchema = baseCustomerSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CustomerResponseDTO = z.infer<typeof customerResponseSchema>;

export const listCustomersQuerySchema = z.object({
  providerId: z.string().uuid('Invalid provider ID'),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type ListCustomersQueryDTO = z.infer<typeof listCustomersQuerySchema>;
