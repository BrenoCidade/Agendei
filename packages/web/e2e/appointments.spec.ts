import { expect, test } from './fixtures/auth.fixture';

test.describe('appointments', () => {
  test('profissional visualiza agenda', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard');

    await expect(page.getByText('Agenda de Hoje')).toBeVisible();
    await expect(page.getByText('Agendamentos Hoje')).toBeVisible();
    await expect(page.getByText('Agenda do Dia')).toBeVisible();
  });
});
