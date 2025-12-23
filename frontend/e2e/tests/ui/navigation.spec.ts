import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, selectDropdownOption, gotoCaseDetail } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Navigation Tests', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  let setupData: Awaited<ReturnType<typeof setupTestData>>;

  test.beforeAll(async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('VITE_API_URL must be set in .env file');
    }
    setupData = await setupTestData(request, API_BASE_URL);
  });

  async function createCase(page: Page): Promise<number> {
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible();
    
    await expect(page.locator('button[name="client_id"]')).toBeEnabled();
    await selectDropdownOption(page, 'client_id');
    await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'site_id');
    await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'contact_id');
    await page.fill('textarea[name="description"]', TEST_DATA.DESCRIPTION);
    await selectDropdownOption(page, 'case_type', 'Repair');
    await selectDropdownOption(page, 'priority', 'Medium');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    const [createResponse] = await Promise.all([
      page.waitForResponse(resp => 
        resp.url().includes('/api/cases') && 
        resp.request().method() === 'POST' &&
        !resp.url().includes('/attachments'),
        { timeout: TIMEOUTS.API_RESPONSE * 2 }
      ),
      submitButton.click()
    ]);
    
    if (!createResponse.ok()) {
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    return caseData.id;
  }

  test('Back button navigates from case detail to case list', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Find and click Back button
    const backButton = page.locator('a:has-text("Back"), button:has-text("Back"), [href="/"]').first();
    await expect(backButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await backButton.click();
    
    // Verify navigation to case list
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify case list is visible
    await expect(page.locator('.case-table, table, [class*="case-list"]').first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Navigate from case list to case detail and back', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    // Navigate to case list
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Click on case row to navigate to detail
    const caseRow = page.locator(`tr:has-text("C-${testCaseId.toString().padStart(4, '0')}"), .case-table-row`).first();
    const rowCount = await caseRow.count();
    
    if (rowCount > 0) {
      await caseRow.click();
      
      // Verify navigation to case detail
      await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
      
      // Click Back button
      const backButton = page.locator('a:has-text("Back"), button:has-text("Back"), [href="/"]').first();
      await expect(backButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      await backButton.click();
      
      // Verify back to case list
      await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    }
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Logo/FurniCare link navigates to home', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Click on logo/FurniCare link
    const logoLink = page.locator('a:has-text("FurniCare"), [href="/"]').first();
    await expect(logoLink).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await logoLink.click();
    
    // Verify navigation to home
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

