import { randomUUID } from 'crypto';

export interface ProfessionalCredentials {
  name: string;
  email: string;
  password: string;
  businessName: string;
  phone: string;
}

export function buildProfessionalCredentials(
  overrides: Partial<ProfessionalCredentials> = {},
): ProfessionalCredentials {
  const suffix = randomUUID().slice(0, 8);

  return {
    name: `Profissional E2E ${suffix}`,
    email: `profissional-${suffix}@test.com`,
    password: 'Test@1234',
    businessName: `Negocio E2E ${suffix}`,
    phone: '11999999999',
    ...overrides,
  };
}
