import { test, expect } from '@playwright/test';
import { seedHousekeeper } from './fixtures/seed';

test('housekeeper starts and completes a task', async ({ page }) => {
  const { username, password, taskId } = await seedHousekeeper();

  // Login
  await page.goto('/login');
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Housekeeper redirects to /housekeeper/dashboard
  await expect(page).toHaveURL(/\/housekeeper\/dashboard/);

  // Go directly to the task page
  await page.goto(`/housekeeper/tasks/${taskId}`);

  // Start cleaning
  await page.getByRole('button', { name: /start cleaning/i }).click();

  // Mark complete
  await page.getByRole('button', { name: /mark complete/i }).click();

  // The completion paragraph (not the status pill) contains "Completed <datetime>."
  // Use a locator that matches the <p> element specifically to avoid strict mode violation.
  await expect(page.locator('p').filter({ hasText: /^Completed/ })).toBeVisible();
});
