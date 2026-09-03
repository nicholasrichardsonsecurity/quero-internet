import { test, expect } from 'playwright/test';

test('admin protegido redireciona visitantes sem sessão para login', async ({ page }) => {
  const response = await page.goto('/admin');

  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle(/Quero Internet/i);
});
