import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, openStage, gotoCaseDetail } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';

test.describe('Final Cost Matching', () => {
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

  test('Final cost matching estimated cost - no approval needed', async ({ page, request }) => {
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
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await openStage(page, 3);
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
    await openStage(page, 4);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS enters final cost matching estimated cost (1000)
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 5);
    
    const finalCostInput = page.locator('input[name="final_cost"]');
    await expect(finalCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await finalCostInput.fill('1000'); // Same as estimated cost
    
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
    
    // Verify no approve/reject buttons (no approval needed)
    await openStage(page, 5);
    const approveButtonFinal = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    await expect(approveButtonFinal).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify CS can complete stage directly
    const completeButton = page.locator('button:has-text("Complete")');
    await expect(completeButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await expect(completeButton).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Final cost differs from estimated cost - approval required', async ({ page, request }) => {
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
    
    await openStage(page, 2);
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await openStage(page, 3);
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
    await openStage(page, 4);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS enters final cost different from estimated cost (950 vs 1000)
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 5);
    
    const finalCostInput = page.locator('input[name="final_cost"]');
    await expect(finalCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await finalCostInput.fill('950'); // Different from estimated cost
    
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
    
    // Verify approve/reject buttons are visible (approval required)
    await openStage(page, 5);
    const approveButtonFinal = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    await expect(approveButtonFinal).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Verify CS cannot complete stage until approved
    const completeButton = page.locator('button:has-text("Complete")');
    // Complete button might be disabled or not visible until approval
    const isCompleteDisabled = await completeButton.isDisabled().catch(() => true);
    expect(isCompleteDisabled).toBeTruthy();
    
    // Cleanup
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

