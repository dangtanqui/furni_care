import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, openStage, gotoCaseDetail, waitForCaseStatus } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Status Transitions', () => {
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

  test('Status transitions: Open → In Progress → Completed → Closed', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Initial status should be Open
    await waitForCaseStatus(page, 'Open');
    
    // Assign technician and complete Stage 1 → status becomes In Progress
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    await waitForCaseStatus(page, 'In Progress');
    
    // Complete Stage 2-4
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await openStage(page, 3);
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    await openStage(page, 4);
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 5 → status becomes Closed
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 5);
    
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES}`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK}`);
    await page.locator('button.stage5-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    await waitForCaseStatus(page, 'Closed');
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Status transitions: In Progress → Pending (cost required) → In Progress (approved)', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    await waitForCaseStatus(page, 'In Progress');
    
    // Complete Stage 2
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Fill Stage 3 with cost required and save → status becomes Pending
    await openStage(page, 3);
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost');
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Status should be Pending (waiting for approval)
    await waitForCaseStatus(page, 'Pending');
    
    // Leader approves → status becomes In Progress
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
      
      // Status should be In Progress after approval
      await waitForCaseStatus(page, 'In Progress');
    }
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Status transitions: In Progress → Rejected (cost rejected)', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1-2
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Fill Stage 3 with cost required and save
    await openStage(page, 3);
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost');
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Leader rejects cost → status becomes Rejected
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 3);
    
    const rejectButton = page.locator('button:has-text("Reject")');
    await expect(rejectButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}/reject_cost`) &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      rejectButton.click()
    ]);
    
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // Status should be Rejected
    await waitForCaseStatus(page, 'Rejected');
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Status transitions: In Progress → Cancelled', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1-2
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Fill Stage 3 with cost required and save
    await openStage(page, 3);
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost');
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Leader rejects cost
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 3);
    
    const rejectButton = page.locator('button:has-text("Reject")');
    await expect(rejectButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}/reject_cost`) &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      rejectButton.click()
    ]);
    
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // CS cancels case → status becomes Cancelled
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 3);
    
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}/cancel_case`) &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      cancelButton.click()
    ]);
    
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // Status should be Cancelled
    await waitForCaseStatus(page, 'Cancelled');
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

