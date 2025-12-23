import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, gotoCaseDetail, rejectCost, rejectFinalCost } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Cost Rejection Flow', () => {
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

  test('Stage 3: Cost rejection flow - Technician can update and resubmit', async ({ page, request }) => {
    // Create case and progress to Stage 3 with cost required
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2 as technician
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Fill Stage 3 and enable cost required, then save
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost description');
    
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
    
    await rejectCost(page, testCaseId);
    
    // Verify case status is rejected
    await expect(page.getByRole('status', { name: /Case status: Rejected/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Technician should be able to edit and update cost
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Verify technician can edit cost fields
    const estimatedCostInput = page.locator('input[name="estimated_cost"]');
    await expect(estimatedCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(estimatedCostInput).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Update cost
    await estimatedCostInput.fill('800');
    await page.locator('textarea[name="cost_description"]').fill('Updated cost description');
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Leader should see approve/reject buttons again
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const approveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    await expect(approveButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Stage 5: Final cost rejection flow - CS can update and resubmit', async ({ page, request }) => {
    // Create case and progress to Stage 5 with final cost
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
    
    // Leader approves Stage 3 cost
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
    
    // CS enters final cost
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const finalCostInput = page.locator('input[name="final_cost"]');
    await expect(finalCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await finalCostInput.fill('950');
    
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      saveButton.click()
    ]);
    
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // Leader rejects final cost
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await rejectFinalCost(page, testCaseId);
    
    // Verify case status is rejected
    await expect(page.getByRole('status', { name: /Case status: Rejected/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS should be able to edit and update final cost
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Verify CS can edit final cost
    await expect(finalCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(finalCostInput).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Update final cost
    await finalCostInput.fill('900');
    
    const updateButton = page.locator('button:has-text("Update"):not([disabled])');
    await expect(updateButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      updateButton.click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Leader should see approve/reject buttons again
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const finalCostApproveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    await expect(finalCostApproveButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

