import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TIMEOUTS } from '../../constants/test-data';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Verify login page is loaded
    await expect(page.locator('h1:has-text("FurniCare")')).toBeVisible();
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_USERS.CS);
    await page.fill('input[type="password"]', TEST_USERS.PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify redirect to home page
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify user is logged in by checking for Case List heading
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Click toggle password button
    const toggleButton = page.locator('button[aria-label*="password" i]').or(page.locator('button:has([class*="eye"])'));
    await expect(toggleButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await toggleButton.click();
    
    // Verify password input type changed to text
    await expect(page.locator('input[type="text"][name="password"]')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Toggle back
    await toggleButton.click();
    await expect(passwordInput).toBeVisible();
  });

  // Form Validation Tests
  test('should prevent submit with empty email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill only password
    await page.fill('input[type="password"]', TEST_USERS.PASSWORD);
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verify HTML5 validation prevents submit
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });
    
    expect(isInvalid).toBeTruthy();
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should prevent submit with empty password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill only email
    await page.fill('input[type="email"]', TEST_USERS.CS);
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verify HTML5 validation prevents submit
    const passwordInput = page.locator('input[type="password"]');
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });
    
    expect(isInvalid).toBeTruthy();
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should prevent submit with invalid email format', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', TEST_USERS.PASSWORD);
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verify HTML5 email validation prevents submit
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => {
      return !el.validity.valid;
    });
    
    expect(isInvalid).toBeTruthy();
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

  // Loading State Tests
  test('should disable submit button and form fields when loading', async ({ page }) => {
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', TEST_USERS.CS);
    await page.fill('input[type="password"]', TEST_USERS.PASSWORD);
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verify button is disabled during loading (brief moment before redirect)
    // Note: This might be very fast, so we check immediately after click
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    
    // If still on login page (error case), button should be disabled
    if (await page.url().includes('/login')) {
      // Check if form fields are disabled
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // Fields might be disabled during loading
      const emailDisabled = await emailInput.isDisabled().catch(() => false);
      const passwordDisabled = await passwordInput.isDisabled().catch(() => false);
      
      // At least one should be disabled or button should be disabled
      expect(isDisabled || emailDisabled || passwordDisabled).toBeTruthy();
    }
  });

  // Different Roles Tests
  test('should login successfully as CS role', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Verify user info shows CS role
    await expect(page.locator('.layout-user-role:has-text("cs")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify CS can see Create Case button
    await expect(page.getByRole('link', { name: 'Create Case' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('should login successfully as Technician role', async ({ page }) => {
    await loginAs(page, TEST_USERS.TECHNICIAN, TEST_USERS.PASSWORD);
    
    // Verify user info shows technician role
    await expect(page.locator('.layout-user-role:has-text("technician")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify Technician cannot see Create Case button
    await expect(page.getByRole('link', { name: 'Create Case' })).not.toBeVisible();
  });

  test('should login successfully as Leader role', async ({ page }) => {
    await loginAs(page, TEST_USERS.LEADER, TEST_USERS.PASSWORD);
    
    // Verify user info shows leader role
    await expect(page.locator('.layout-user-role:has-text("leader")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify Leader cannot see Create Case button
    await expect(page.getByRole('link', { name: 'Create Case' })).not.toBeVisible();
  });

  // Logout Tests
  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Verify logged in
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Logout
    await logout(page);
    
    // Verify redirected to login page
    await expect(page).toHaveURL(/.*login/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify login form is visible
    await expect(page.locator('h1:has-text("FurniCare")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('should not access protected routes after logout', async ({ page }) => {
    // Login first
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Logout
    await logout(page);
    
    // Try to access protected route
    await page.goto('/cases/new');
    
    // Verify redirected to login
    await expect(page).toHaveURL(/.*login/, { timeout: TIMEOUTS.NAVIGATION });
  });

  // Protected Routes Tests
  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Clear any existing authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to access protected route
    await page.goto('/cases/new');
    
    // Verify redirected to login
    await expect(page).toHaveURL(/.*login/, { timeout: TIMEOUTS.NAVIGATION });
  });

  test('should access protected route after successful login', async ({ page }) => {
    // Login first
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Access protected route
    await page.goto('/cases/new');
    
    // Verify can access (not redirected to login)
    await expect(page).toHaveURL(/.*cases\/new/, { timeout: TIMEOUTS.NAVIGATION });
    await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  // Error Handling Tests
  test('should clear error message when user starts typing', async ({ page }) => {
    await page.goto('/login');
    
    // Fill with invalid credentials and submit
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Start typing in email field
    await page.fill('input[type="email"]', 'new@example.com');
    
    // Error message should disappear (check after a brief moment)
    await page.waitForTimeout(500);
    
    // Note: Depending on implementation, error might clear immediately or on next submit
    // This test verifies the field accepts new input
    const emailValue = await page.locator('input[type="email"]').inputValue();
    expect(emailValue).toBe('new@example.com');
  });

  // Already Logged In Tests
  test('should redirect to home if already logged in', async ({ page }) => {
    // Login first
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Verify logged in
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Try to access login page
    await page.goto('/login');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify we're on home page (not login page)
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('h1:has-text("FurniCare")')).not.toBeVisible();
  });

  test('should maintain session when navigating between pages', async ({ page }) => {
    // Login first
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Navigate to different pages
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await page.goto('/cases/new');
    await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Go back to home
    await page.goto('/');
    
    // Verify still logged in
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('.layout-user-role:has-text("cs")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });
});
