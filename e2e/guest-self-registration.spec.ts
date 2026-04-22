import { test, expect } from '@playwright/test';
import { seedFlow } from './fixtures/seed.js';

test('guest self-registration happy path', async ({ page }) => {
  const { confirmCode } = await seedFlow();

  await page.goto(`/register/${confirmCode}`);

  // Page heading area — the page shows "Guest registration" label + property name h1
  await expect(page.getByText('Guest registration')).toBeVisible();

  // Fill email
  await page.getByLabel('Your email').fill('alice@example.com');

  // Fill first guest fields
  await page.getByLabel('First name').fill('Alice');
  await page.getByLabel('Last name').fill('Doe');

  // Age category and document type have sensible defaults (ADULT / PASSPORT), no need to change

  // Document number is required
  await page.getByLabel('Document number').fill('AB123456');

  // GDPR consent — the checkbox has no <Label> wrapper, it's an inline <label> element
  // Use locator by the checkbox name attribute
  await page.locator('input[name="guests.0.gdprConsent"]').check();

  // Submit
  await page.getByRole('button', { name: 'Submit registration' }).click();

  // Should redirect to success page
  await expect(page).toHaveURL(new RegExp(`/register/${confirmCode}/success`), { timeout: 30_000 });
  await expect(page.getByText('Registration received')).toBeVisible();
});
