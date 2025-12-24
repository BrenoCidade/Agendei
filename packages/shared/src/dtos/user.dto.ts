import z from 'zod';

export const baseUserSchema = z.object({
  name: z
    .string()
    .min(2, 'The name must have at least 2 characters')
    .max(50, 'The name must have at most 50 characters')
    .transform((name) => {
      return name
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,15}$/, 'Invalid phone number'))
    .optional(),
  businessName: z
    .string()
    .min(2, 'The business name must have at least 2 characters')
    .max(100, 'The business name must have at most 100 characters')
    .trim(),
});

export const registerUserSchema = baseUserSchema.extend({
  password: z
    .string()
    .min(8, 'The password must have at least 8 characters')
    .max(72, 'The password must have at most 72 characters')
    .regex(/[A-Z]/, 'The password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'The password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'The password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'The password must contain at least one special character',
    ),
});

export type RegisterUserDTO = z.infer<typeof registerUserSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  businessName: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;

export const publicProviderProfileSchema = z.object({
  slug: z.string(),
  businessName: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
});

export type PublicProviderProfileDTO = z.infer<
  typeof publicProviderProfileSchema
>;
