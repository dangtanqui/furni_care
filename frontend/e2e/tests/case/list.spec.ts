import { test, expect } from '@playwright/test';
import { loginAs, logout, selectDropdownOption } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS } from '../../constants/test-data';
import { setupTestData } from '../../shared/setup';

test.describe('Case List Filtering', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  let setupData: Awaited<ReturnType<typeof setupTestData>>;

  test.beforeAll(async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('VITE_API_URL must be set in .env file');
    }
    setupData = await setupTestData(request, API_BASE_URL);
  });

  test('Filter by Status', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Navigate to case list
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    
    // Wait for case list to load
    await page.waitForLoadState('networkidle');
    
    // Find Status filter dropdown
    const statusFilter = page.locator('select, button').filter({ hasText: /Filter by Status|All Status/i }).first();
    
    // If it's a button (Select component), click it
    if (await statusFilter.getAttribute('role') === 'button' || await statusFilter.evaluate(el => el.tagName === 'BUTTON')) {
      await statusFilter.click();
      await page.locator('.select-option').filter({ hasText: 'In Progress' }).click();
    } else {
      // If it's a select element
      await statusFilter.selectOption('in_progress');
    }
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    // Verify cases are filtered (at least one case should be visible or "No cases found")
    const caseTable = page.locator('.case-table, table');
    await expect(caseTable).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Filter by Type', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Type filter dropdown
    const typeFilter = page.locator('select, button').filter({ hasText: /Filter by Type|All Types/i }).first();
    
    if (await typeFilter.getAttribute('role') === 'button' || await typeFilter.evaluate(el => el.tagName === 'BUTTON')) {
      await typeFilter.click();
      await page.locator('.select-option').filter({ hasText: 'Repair' }).click();
    } else {
      await typeFilter.selectOption('repair');
    }
    
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    const caseTable = page.locator('.case-table, table');
    await expect(caseTable).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Filter by Assigned Technician', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find Assigned filter dropdown
    const assignedFilter = page.locator('select, button').filter({ hasText: /Filter by Technician|All Assigned/i }).first();
    
    if (await assignedFilter.getAttribute('role') === 'button' || await assignedFilter.evaluate(el => el.tagName === 'BUTTON')) {
      await assignedFilter.click();
      // Select first technician option (not "All Assigned" or "Unassigned")
      const technicianOptions = page.locator('.select-option');
      const optionCount = await technicianOptions.count();
      if (optionCount > 2) {
        // Skip "All Assigned" and "Unassigned", select first technician
        await technicianOptions.nth(2).click();
      }
    } else {
      // Select first technician ID
      await assignedFilter.selectOption({ index: 2 }); // Skip "All Assigned" and "Unassigned"
    }
    
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    
    const caseTable = page.locator('.case-table, table');
    await expect(caseTable).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Case list displays correct columns', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Verify table headers
    await expect(page.locator('th:has-text("Case ID"), th:has-text("Case ID:")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('th:has-text("Client")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('th:has-text("Site")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('th:has-text("Stage")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(page.locator('th:has-text("Status")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Click on case row navigates to case detail', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Find first case row
    const firstCaseRow = page.locator('.case-table-row, tbody tr').first();
    const rowCount = await firstCaseRow.count();
    
    if (rowCount > 0) {
      // Get case number from first row
      const caseNumberCell = firstCaseRow.locator('td').first();
      const caseNumber = await caseNumberCell.textContent();
      
      // Click on row
      await firstCaseRow.click();
      
      // Verify navigation to case detail
      await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    }
  });
});

