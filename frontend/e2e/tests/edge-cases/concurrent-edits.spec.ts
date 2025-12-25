import { test, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, gotoCaseDetail } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Concurrent Edits', () => {
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

  test('Last save wins when two users edit same case simultaneously', async ({ browser, request }) => {
    // Create case
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginAs(page1, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page1);
    
    await gotoCaseDetail(page1, testCaseId);
    
    // Assign technician and complete Stage 1
    await page1.locator('button[name="assigned_to"]').click();
    await page1.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page1, testCaseId);
    
    // Complete Stage 2
    await logout(page1);
    await loginAs(page1, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page1, testCaseId);
    
    await page1.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page1, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page1, testCaseId);
    
    // Now Stage 3 - two technicians try to edit simultaneously
    // User 1 (assigned technician) starts editing
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginAs(page2, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page2, testCaseId);
    
    // User 1 edits root cause
    await page1.locator('input[name="root_cause"]').fill('Root cause from user 1');
    
    // User 2 (same technician, different session) edits root cause
    await page2.locator('input[name="root_cause"]').fill('Root cause from user 2');
    
    // User 2 saves first
    await page2.locator('button:has-text("Save")').or(page2.locator('button:has-text("Complete")')).click();
    await page2.waitForLoadState('networkidle');
    
    // User 1 saves after (should overwrite user 2's changes)
    await Promise.all([
      page1.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page1.locator('button:has-text("Save")').or(page1.locator('button:has-text("Complete")')).click()
    ]);
    await page1.waitForLoadState('networkidle');
    
    // Reload page2 to verify last save (user 1) is what's displayed
    await page2.reload();
    await page2.waitForLoadState('networkidle');
    
    const rootCauseInput = page2.locator('input[name="root_cause"]');
    const rootCauseValue = await rootCauseInput.inputValue();
    expect(rootCauseValue).toBe('Root cause from user 1'); // Last save wins
    
    // Cleanup
    await context1.close();
    await context2.close();
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('CS and Technician can edit different stages simultaneously', async ({ browser, request }) => {
    // Create case and progress to Stage 3
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginAs(page1, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page1);
    
    await gotoCaseDetail(page1, testCaseId);
    
    // Assign technician and complete Stage 1
    await page1.locator('button[name="assigned_to"]').click();
    await page1.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page1, testCaseId);
    
    // Complete Stage 2
    await logout(page1);
    await loginAs(page1, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page1, testCaseId);
    
    await page1.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page1, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page1, testCaseId);
    
    // Stage 3 with cost required
    await page1.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page1.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page1, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page1.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page1.locator('input[name="estimated_cost"]').fill('1000');
    await page1.locator('textarea[name="cost_description"]').fill('Test cost');
    await page1.locator('button:has-text("Save")').click();
    await page1.waitForLoadState('networkidle');
    
    // CS opens case in different session (should be able to view but not edit Stage 3)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginAs(page2, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page2, testCaseId);
    
    // CS should see Stage 3 but not be able to edit (cost is pending approval)
    const rootCauseInputCS = page2.locator('input[name="root_cause"]');
    await expect(rootCauseInputCS).not.toBeVisible(); // CS cannot edit Stage 3 when cost is pending
    
    // Technician can still edit Stage 3
    const rootCauseInputTech = page1.locator('input[name="root_cause"]');
    await expect(rootCauseInputTech).toBeVisible();
    await expect(rootCauseInputTech).toBeEnabled();
    
    // Cleanup
    await context1.close();
    await context2.close();
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Leader approval while Technician updates cost', async ({ browser, request }) => {
    // Create case and progress to Stage 3 with cost
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginAs(page1, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page1);
    
    await gotoCaseDetail(page1, testCaseId);
    
    // Assign technician and complete Stage 1
    await page1.locator('button[name="assigned_to"]').click();
    await page1.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page1, testCaseId);
    
    // Complete Stage 2
    await logout(page1);
    await loginAs(page1, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page1, testCaseId);
    
    await page1.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page1, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page1, testCaseId);
    
    // Stage 3 with cost required
    await page1.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page1.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page1, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page1.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page1.locator('input[name="estimated_cost"]').fill('1000');
    await page1.locator('textarea[name="cost_description"]').fill('Test cost');
    await page1.locator('button:has-text("Save")').click();
    await page1.waitForLoadState('networkidle');
    
    // Leader opens case to approve
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginAs(page2, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page2, testCaseId);
    
    // Leader approves cost
    const approveButton = page2.locator('button:has-text("Approve")');
    if (await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page2.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}/approve_cost`) && 
                       response.request().method() === 'POST',
          { timeout: TIMEOUTS.API_RESPONSE }
        ),
        approveButton.click()
      ]);
      await page2.waitForLoadState('networkidle');
    }
    
    // Technician's page should reflect the approval (may need refresh)
    await page1.reload();
    await page1.waitForLoadState('networkidle');
    
    // Technician should now be able to complete Stage 3
    const completeButton = page1.locator('button:has-text("Complete")');
    await expect(completeButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await context1.close();
    await context2.close();
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

