import { expect, test } from './fixtures/auth.fixture';

test.describe('availability', () => {
  test('definir horario valido', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/settings');
    await page.getByRole('tab', { name: 'Horários' }).click();

    const mondaySwitch = page.getByRole('switch').first();

    await mondaySwitch.click();
    await page.locator('input[type="time"]').nth(0).fill('09:00');
    await page.locator('input[type="time"]').nth(1).fill('17:00');

    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    await expect(page.getByText('Horários salvos com sucesso!')).toBeVisible();
  });

  test('validar mensagem para horario invalido', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/settings');
    await page.getByRole('tab', { name: 'Horários' }).click();

    const mondaySwitch = page.getByRole('switch').first();

    await mondaySwitch.click();
    await page.locator('input[type="time"]').nth(0).fill('18:00');
    await page.locator('input[type="time"]').nth(1).fill('09:00');

    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    await expect(page.getByText('Não foi possível salvar os horários.')).toBeVisible();
  });
});
