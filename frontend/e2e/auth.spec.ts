import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page is loaded
    await expect(page.locator('h1:has-text("FurniCare")')).toBeVisible();
    
    // Fill login form
    await page.fill('input[type="email"]', 'cs@demo.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify redirect to home page
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Verify user is logged in by checking for Case List heading
    // Using getByRole is more reliable than text selectors
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: 5000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Click toggle password button (if exists)
    const toggleButton = page.locator('button[aria-label*="password" i]').or(page.locator('button:has([class*="eye"])'));
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(page.locator('input[type="text"]')).toBeVisible();
    }
  });
});

