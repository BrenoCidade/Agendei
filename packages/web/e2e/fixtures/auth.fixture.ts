import { expect, test as base } from '@playwright/test';
import {
  buildProfessionalCredentials,
  type ProfessionalCredentials,
} from '../utils/test-data';

interface AuthFixtures {
  createProfessional: (
    overrides?: Partial<ProfessionalCredentials>,
  ) => Promise<ProfessionalCredentials>;
  loginAsProfessional: (
    overrides?: Partial<ProfessionalCredentials>,
  ) => Promise<ProfessionalCredentials>;
}

export const test = base.extend<AuthFixtures>({
  createProfessional: async ({ request }, use) => {
    await use(async (overrides = {}) => {
      const credentials = buildProfessionalCredentials(overrides);

      const registerResponse = await request.post('/api/auth/register', {
        data: {
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          businessName: credentials.businessName,
          phone: credentials.phone,
        },
      });

      expect(registerResponse.ok()).toBeTruthy();
      return credentials;
    });
  },
  loginAsProfessional: async ({ page, createProfessional }, use) => {
    await use(async (overrides = {}) => {
      const credentials = await createProfessional(overrides);

      await page.goto('/login');
      await page.getByLabel('E-mail').fill(credentials.email);
      await page.getByLabel('Senha').fill(credentials.password);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      return credentials;
    });
  },
});

export { expect };
