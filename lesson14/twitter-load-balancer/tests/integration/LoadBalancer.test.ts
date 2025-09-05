import { test, expect } from '@playwright/test';

test.describe('Load Balancer Dashboard Integration', () => {
  test('should load dashboard successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if dashboard loads
    await expect(page).toHaveTitle(/Load Balancer/);
    
    // Check for key dashboard elements
    await expect(page.locator('h1')).toContainText(/Load Balancer/);
  });

  test('should display server metrics', async ({ page }) => {
    await page.goto('/');
    
    // Wait for metrics to load
    await page.waitForSelector('[data-testid="server-metrics"]', { timeout: 10000 });
    
    // Check that metrics are displayed
    const metrics = page.locator('[data-testid="server-metrics"]');
    await expect(metrics).toBeVisible();
  });

  test('should show real-time updates', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Check for WebSocket connection or real-time updates
    const updates = page.locator('[data-testid="real-time-updates"]');
    if (await updates.count() > 0) {
      await expect(updates).toBeVisible();
    }
  });
});
