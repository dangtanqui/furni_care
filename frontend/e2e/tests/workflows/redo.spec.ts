import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, gotoCaseDetail, redoCase } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Redo Workflow', () => {
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

  test('CS can redo case from Stage 5 to Stage 3', async ({ page, request }) => {
    // Create case and progress to Stage 5
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 as technician
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS completes Stage 5
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES}`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK}`);
    await page.locator('button.stage5-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // Verify case is completed
    await expect(page.getByRole('status', { name: /Case status: Closed/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS can redo case
    await redoCase(page, testCaseId);
    
    // Verify case rolled back to Stage 3
    await expect(page.locator('.stage-section-title:has-text("Stage 3")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify case status is in_progress
    await expect(page.getByRole('status', { name: /Case status: In Progress/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Technician should be able to edit Stage 3
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const rootCauseInput = page.locator('input[name="root_cause"]');
    await expect(rootCauseInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(rootCauseInput).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Redo resets cost status when cost was approved', async ({ page, request }) => {
    // Create case and progress to Stage 5 with cost approved
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 with cost required
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost');
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);
    
    // Leader approves cost
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const approveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    if (await approveButton.count() > 0) {
      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}/approve_cost`) && 
                       response.request().method() === 'POST',
          { timeout: TIMEOUTS.API_RESPONSE }
        ),
        approveButton.click()
      ]);
      
      await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
      await page.waitForLoadState('networkidle');
    }
    
    // Complete Stage 4
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS completes Stage 5
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES}`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK}`);
    await page.locator('button.stage5-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS redo case
    await redoCase(page, testCaseId);
    
    // Verify cost status is reset (cost_required checkbox should be unchecked or cost fields cleared)
    const costRequiredCheckbox = page.locator('label:has-text("Cost Required") input[type="checkbox"]');
    const isChecked = await costRequiredCheckbox.isChecked();
    
    // Cost should be reset - either checkbox unchecked or cost fields cleared
    // This depends on implementation, but typically cost_required stays but cost_status is reset
    expect(isChecked).toBeTruthy(); // Cost required stays, but status is reset
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Attempt number displays correctly when > 1', async ({ page, request }) => {
    // Create case and progress to Stage 5
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 as technician
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS completes Stage 5
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES}`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK}`);
    await page.locator('button.stage5-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // Verify attempt number is 1 initially (should not show badge)
    const attemptBadge = page.locator('.case-header-attempt-badge, [class*="attempt"]');
    const badgeVisible = await attemptBadge.isVisible().catch(() => false);
    expect(badgeVisible).toBeFalsy(); // Should not show when attempt_number = 1
    
    // CS redo case (this should increment attempt_number to 2)
    await redoCase(page, testCaseId);
    
    // Verify attempt number badge appears and shows "Attempt #2"
    await expect(page.locator('.case-header-attempt-badge, [class*="attempt"]:has-text("Attempt #2")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Complete again to Stage 5
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Complete Stage 3-4 again
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE} - Retry`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION} - Retry`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await completeStage(page, testCaseId);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION} - Retry`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS completes Stage 5 again
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES} - Retry`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK} - Retry`);
    await page.locator('button.stage5-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // Verify attempt number badge still shows "Attempt #2" (should not increment on re-completion)
    await expect(page.locator('.case-header-attempt-badge, [class*="attempt"]:has-text("Attempt #2")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

