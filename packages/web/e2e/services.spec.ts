import { expect, test } from './fixtures/auth.fixture';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

test.describe('services', () => {
  test('criar servico', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/services');

    const serviceName = `Corte E2E ${uniqueSuffix()}`;
    await page.getByRole('button', { name: 'Novo servico' }).click();

    await page.getByLabel('Nome').fill(serviceName);
    await page.getByLabel('Descricao').fill('Servico criado via Playwright');
    await page.getByLabel('Duracao (min)').fill('45');
    await page.getByLabel('Preco (R$)').fill('59,90');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: serviceName })).toBeVisible();
  });

  test('editar servico', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/services');

    const originalName = `Barba E2E ${uniqueSuffix()}`;
    await page.getByRole('button', { name: 'Novo servico' }).click();
    await page.getByLabel('Nome').fill(originalName);
    await page.getByLabel('Descricao').fill('Servico para editar');
    await page.getByLabel('Duracao (min)').fill('30');
    await page.getByLabel('Preco (R$)').fill('40,00');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: originalName })).toBeVisible();

    const card = page.locator('[class*="p-4"]').filter({
      has: page.getByRole('heading', { name: originalName }),
    });

    await card.getByRole('button').first().click();

    const updatedName = `${originalName} Atualizado`;
    await page.getByLabel('Nome').fill(updatedName);
    await page.getByLabel('Preco (R$)').fill('55,00');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
  });

  test('remover servico', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/services');

    const removableName = `Remover E2E ${uniqueSuffix()}`;
    await page.getByRole('button', { name: 'Novo servico' }).click();
    await page.getByLabel('Nome').fill(removableName);
    await page.getByLabel('Descricao').fill('Servico temporario');
    await page.getByLabel('Duracao (min)').fill('30');
    await page.getByLabel('Preco (R$)').fill('30,00');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: removableName })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());

    const card = page.locator('[class*="p-4"]').filter({
      has: page.getByRole('heading', { name: removableName }),
    });

    await card.getByRole('button').nth(1).click();

    await expect(page.getByRole('heading', { name: removableName })).not.toBeVisible();
  });

  test('disponibilidade salva pela tela de configuracoes', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/settings');
    await page.getByRole('tab', { name: 'Horarios' }).click();

    await page.getByRole('switch').first().click();
    await page.getByRole('button', { name: 'Salvar alteracoes' }).click();

    await expect(page.getByRole('button', { name: 'Salvar alteracoes' })).toBeDisabled();
  });
});
