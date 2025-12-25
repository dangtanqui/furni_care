import { test, expect } from '@playwright/test';
import type { Page, Route } from '@playwright/test';
import { loginAs, selectDropdownOption, completeStage, fillStageChecklist, gotoCaseDetail } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Network Error Handling', () => {
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
    
    await selectDropdownOption(page, 'client_id');
    await selectDropdownOption(page, 'site_id');
    await selectDropdownOption(page, 'contact_id');
    await page.fill('textarea[name="description"]', TEST_DATA.DESCRIPTION);
    await selectDropdownOption(page, 'case_type', 'Repair');
    await selectDropdownOption(page, 'priority', 'Medium');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    const [createResponse] = await Promise.all([
      page.waitForResponse(resp => 
        resp.url().includes('/api/cases') && 
        resp.request().method() === 'POST' &&
        !resp.url().includes('/attachments'),
        { timeout: TIMEOUTS.API_RESPONSE * 2 }
      ),
      submitButton.click()
    ]);
    
    const caseData = await createResponse.json();
    return caseData.id;
  }

  test('Error message displays when save fails due to network error', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2
    await page.goto('/login');
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Intercept API call and simulate network error
    await page.route('**/api/cases/*', (route: Route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    
    // Try to complete stage - should fail
    await page.locator('button:has-text("Complete")').click();
    
    // Wait a bit for error to appear
    await page.waitForTimeout(2000);
    
    // Verify error message is displayed (could be toast, error banner, or in form)
    const errorMessage = page.locator('text=/error|failed|network/i').or(
      page.locator('.error-message, [class*="error"]')
    );
    const errorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Error should be visible (either as toast or inline error)
    expect(errorVisible).toBeTruthy();
    
    // Remove route interception
    await page.unroute('**/api/cases/*');
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Error message displays when loading case list fails', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Intercept API call and simulate network error
    await page.route('**/api/cases*', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(2000);
    
    // Verify error message is displayed
    const errorMessage = page.locator('text=/error|failed|network|load/i').or(
      page.locator('.case-list-error, [class*="error"]')
    );
    const errorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Error should be visible
    expect(errorVisible).toBeTruthy();
    
    // Remove route interception
    await page.unroute('**/api/cases*');
  });

  test('Form fields remain enabled after network error during save', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2
    await page.goto('/login');
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Intercept API call and simulate timeout
    await page.route('**/api/cases/*', (route: Route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        // Simulate timeout by not responding
        setTimeout(() => route.abort('timedout'), 100);
      } else {
        route.continue();
      }
    });
    
    const investigationTextarea = page.locator('textarea[name="investigation_report"]');
    await investigationTextarea.fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    
    // Try to complete stage
    await page.locator('button:has-text("Complete")').click();
    
    // Wait for error
    await page.waitForTimeout(3000);
    
    // Verify form fields are still enabled (user can retry)
    await expect(investigationTextarea).toBeEnabled();
    
    // Verify Complete button is still enabled
    const completeButton = page.locator('button:has-text("Complete")');
    await expect(completeButton).toBeEnabled();
    
    // Remove route interception
    await page.unroute('**/api/cases/*');
    
    // Now save should work
    await completeStage(page, testCaseId);
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Loading state shows during API call', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    
    // Intercept and delay API call to see loading state
    await page.route('**/api/cases/*', async (route: Route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        // Delay response
        await page.waitForTimeout(1000);
        route.continue();
      } else {
        route.continue();
      }
    });
    
    // Click Complete button
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    
    // Verify loading state appears (could be "Processing...", disabled button, or spinner)
    const loadingIndicator = page.locator('text=Processing').or(
      page.locator('[class*="loading"], [class*="spinner"]')
    );
    const loadingVisible = await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // Loading state should be visible (or button should be disabled)
    const buttonDisabled = await completeButton.isDisabled().catch(() => false);
    expect(loadingVisible || buttonDisabled).toBeTruthy();
    
    // Wait for request to complete
    await page.waitForLoadState('networkidle');
    
    // Remove route interception
    await page.unroute('**/api/cases/*');
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Case list shows error when API fails', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Intercept and fail API call
    await page.route('**/api/cases*', (route: Route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for error to appear
    await page.waitForTimeout(2000);
    
    // Verify error message is displayed
    const errorMessage = page.locator('text=/error|failed/i').or(
      page.locator('.case-list-error, [class*="error"]')
    );
    const errorVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // Error should be visible
    expect(errorVisible).toBeTruthy();
    
    // Remove route interception
    await page.unroute('**/api/cases*');
  });
});

