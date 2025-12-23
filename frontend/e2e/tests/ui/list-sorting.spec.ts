import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TIMEOUTS } from '../../constants/test-data';

test.describe('Case List Sorting', () => {
  test('Sort by Case ID', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Case ID header and click to sort
    const caseIdHeader = page.locator('th:has-text("Case ID"), th[role="columnheader"]:has-text("Case ID")').first();
    await expect(caseIdHeader).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Click to sort ascending
    await caseIdHeader.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // Verify sort icon appears
    const sortIcon = page.locator('[class*="sort"], svg[class*="sort"]');
    await expect(sortIcon.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Click again to sort descending
    await caseIdHeader.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
  });

  test('Sort by Client', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Client header and click to sort
    const clientHeader = page.locator('th:has-text("Client"), th[role="columnheader"]:has-text("Client")').first();
    await expect(clientHeader).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await clientHeader.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // Verify sort is applied
    const sortIcon = page.locator('[class*="sort"], svg[class*="sort"]');
    await expect(sortIcon.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Sort by Stage', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Stage header and click to sort
    const stageHeader = page.locator('th:has-text("Stage"), th[role="columnheader"]:has-text("Stage")').first();
    await expect(stageHeader).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await stageHeader.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // Verify sort is applied
    const sortIcon = page.locator('[class*="sort"], svg[class*="sort"]');
    await expect(sortIcon.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Sort by Status', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Status header and click to sort
    const statusHeader = page.locator('th:has-text("Status"), th[role="columnheader"]:has-text("Status")').first();
    await expect(statusHeader).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await statusHeader.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // Verify sort is applied
    const sortIcon = page.locator('[class*="sort"], svg[class*="sort"]');
    await expect(sortIcon.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });
});

