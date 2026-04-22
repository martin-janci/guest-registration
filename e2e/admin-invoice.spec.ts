import { test, expect } from '@playwright/test';
import { seedAdmin } from './fixtures/seed';

test('admin creates an invoice and adds a line item', async ({ page }) => {
  const { username, password } = await seedAdmin();

  // Login
  await page.goto('/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  // Navigate to invoices
  await page.getByRole('link', { name: /^invoices$/i }).click();
  await expect(page).toHaveURL(/\/admin\/invoices/);

  // Click "New invoice"
  await page.getByRole('link', { name: /new invoice/i }).click();
  await expect(page).toHaveURL(/\/admin\/invoices\/new/);

  // Fill the invoice header form
  await page.getByLabel(/client name/i).fill('Test Client');
  // issueDate has a defaultValue already set (today), just ensure it's set
  await page.getByRole('button', { name: /create invoice/i }).click();

  // Should redirect to the invoice detail page
  await expect(page).toHaveURL(/\/admin\/invoices\/\d+/);

  // Add a line item using the inline form on the detail page.
  // ItemAddForm uses plain <label> elements without htmlFor, so use name locators.
  await page.locator('input[name="description"]').fill('Stay');
  await page.locator('input[name="quantity"]').fill('2');
  await page.locator('input[name="unitPrice"]').fill('50');
  await page.locator('input[name="vatRate"]').fill('0');
  await page.getByRole('button', { name: /^add$/i }).click();

  // formatMoney uses comma as decimal separator: 100.00 → "100,00 €"
  // The total section shows "100,00 €" in multiple elements; just assert at least one is visible.
  await expect(page.getByText(/100,00\s*€/).first()).toBeVisible();

  // Download PDF button should be visible
  await expect(page.getByRole('link', { name: /download pdf/i })).toBeVisible();
});
