import { test, expect } from '@playwright/test';
import { seedFlow } from './fixtures/seed.js';

test('guest self-registration renders Slovak at the default URL', async ({ page, context }) => {
  const { confirmCode } = await seedFlow();
  // Force Slovak locale via cookie (localeDetection uses NEXT_LOCALE).
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'sk', domain: 'localhost', path: '/' }]);
  await page.goto(`/register/${confirmCode}`);
  // Default locale is sk — eyebrow label must be Slovak.
  await expect(page.getByText('Registrácia hosťa')).toBeVisible();
});

test('guest self-registration renders English at /en', async ({ page }) => {
  const { confirmCode } = await seedFlow();
  await page.goto(`/en/register/${confirmCode}`);
  // English locale — eyebrow label must be English.
  await expect(page.getByText('Guest registration')).toBeVisible();
});
