import { test, expect } from '@playwright/test';

test.describe('protected', () => {
  test('acesso a /dashboard sem token redireciona para /login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });
});
