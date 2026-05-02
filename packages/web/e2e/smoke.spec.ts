import { test, expect } from '@playwright/test';

test('deve abrir a tela de login', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
});
