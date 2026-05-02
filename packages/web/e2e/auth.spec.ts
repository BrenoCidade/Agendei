import { test, expect } from './fixtures/auth.fixture';

test.describe('auth', () => {
  test('login valido redireciona para dashboard', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();
    await expect(page.getByText('Agenda de Hoje')).toBeVisible();
  });

  test('area de clientes mostra estado vazio real sem mock', async ({ loginAsProfessional, page }) => {
    await loginAsProfessional();

    await page.goto('/dashboard/clients');

    await expect(
      page.getByText('Nenhum cliente real apareceu por aqui ainda.'),
    ).toBeVisible();
    await expect(page.getByText('Carlos Silva')).not.toBeVisible();
  });

  test('login invalido mostra erro de credencial', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill('naoexiste@test.com');
    await page.getByLabel('Senha').fill('senha-incorreta');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
