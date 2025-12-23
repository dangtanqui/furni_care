import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, gotoCaseDetail } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';

test.describe('Case Permissions Verification', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  
  let authToken: string;
  let clientId: number;
  let technicianEmail: string;
  let technicianName: string;
  let leaderEmail: string;
  let technicians: Array<{ id: number; name: string; email: string }>;

  // Increase timeout for this test suite as it has many tests
  test.setTimeout(60000);
  
  // Run tests in this file sequentially to avoid database conflicts
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('VITE_API_URL must be set in .env file');
    }

    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: TEST_USERS.CS,
        password: TEST_USERS.PASSWORD
      }
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    authToken = loginData.token;

    const clientsResponse = await request.get(`${API_BASE_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const clients = await clientsResponse.json();
    clientId = clients[0].id;
    
    const sitesResponse = await request.get(`${API_BASE_URL}/api/clients/${clientId}/sites`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    await sitesResponse.json();

    const techniciansResponse = await request.get(`${API_BASE_URL}/api/users/technicians`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    technicians = await techniciansResponse.json();
    const selectedTech = technicians[0];
    technicianEmail = selectedTech.email;
    technicianName = selectedTech.name;

    // Get leader email
    leaderEmail = 'leader@demo.com';
  });

  async function cleanupCase(request: any, testCaseId: number): Promise<void> {
    try {
      await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }).catch(() => {
        // Ignore cleanup errors - case might already be deleted
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async function createCase(page: Page, retries: number = 3): Promise<number> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await page.getByRole('link', { name: 'Create Case' }).click();
        await expect(page).toHaveURL(/.*cases\/new/);
        await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible();
        
        // Wait for form to be ready
        await expect(page.locator('button[name="client_id"]')).toBeEnabled();
        
        await selectDropdownOption(page, 'client_id');
        // Wait for site dropdown to be enabled
        await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
        await selectDropdownOption(page, 'site_id');
        // Wait for contact dropdown to be enabled
        await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
        await selectDropdownOption(page, 'contact_id');
        await page.fill('textarea[name="description"]', TEST_DATA.DESCRIPTION);
        await selectDropdownOption(page, 'case_type', 'Repair');
        await selectDropdownOption(page, 'priority', 'Medium');
        
        const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
        // Wait for submit button to be enabled (all required fields filled)
        await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
        
        // Add small delay before submitting to avoid race conditions
        await page.waitForTimeout(200);
        
        const [createResponse] = await Promise.all([
          page.waitForResponse(resp => 
            resp.url().includes('/api/cases') && 
            resp.request().method() === 'POST' &&
            !resp.url().includes('/attachments'),
            { timeout: TIMEOUTS.API_RESPONSE * 2 } // Double timeout for parallel runs
          ),
          submitButton.click()
        ]);
        
        if (!createResponse.ok()) {
          const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
          const requestUrl = createResponse.url();
          const requestMethod = createResponse.request().method();
          lastError = new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
          
          // Retry on 500 errors (server errors)
          if (createResponse.status() === 500 && attempt < retries) {
            await page.waitForTimeout(1000 * attempt); // Exponential backoff
            continue;
          }
          throw lastError;
        }
        
        const caseData = await createResponse.json();
        if (!caseData || !caseData.id) {
          lastError = new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
          if (attempt < retries) {
            await page.waitForTimeout(1000 * attempt);
            continue;
          }
          throw lastError;
        }
        return caseData.id;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await page.waitForTimeout(1000 * attempt); // Exponential backoff
          // Navigate back to home page before retry
          try {
            await page.goto('/');
            await page.waitForTimeout(500);
          } catch {
            // Ignore navigation errors
          }
        }
      }
    }
    
    throw lastError || new Error('Failed to create case after retries');
  }

  test('Stage 1: Only CS can edit, leader and technician can only view', async ({ page, request }) => {
    // Create case as CS
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // CS should be able to edit Stage 1
    const assignButton = page.locator('button[name="assigned_to"]');
    await expect(assignButton).toBeVisible();
    
    // Login as leader
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Leader should NOT be able to edit Stage 1
    await expect(assignButton).not.toBeVisible();
    
    // Login as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Technician should NOT be able to edit Stage 1
    await expect(assignButton).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 2: Only assigned technician can edit, others can only view', async ({ page, request }) => {
    // Create case and assign technician
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Wait for Processing to disappear and stage to advance
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {
      // Processing might not be present, continue
    });
    
    // Wait for Stage 2 to be visible (stage has advanced)
    await expect(page.locator('.stage-section-title:has-text("Stage 2")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Assigned technician should be able to edit Stage 2
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const investigationTextarea = page.locator('textarea[name="investigation_report"]');
    await expect(investigationTextarea).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS should NOT be able to edit Stage 2
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(investigationTextarea).not.toBeVisible();
    
    // Leader should NOT be able to edit Stage 2
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(investigationTextarea).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 3: Only assigned technician can edit initially, others view', async ({ page, request }) => {
    // Create case and progress to Stage 3
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Assigned technician should be able to edit Stage 3
    const rootCauseInput = page.locator('input[name="root_cause"]');
    await expect(rootCauseInput).toBeVisible();
    
    // CS should NOT be able to edit Stage 3
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(rootCauseInput).not.toBeVisible();
    
    // Leader should NOT be able to edit Stage 3 (before cost required)
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(rootCauseInput).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 3: When cost required, assigned technician and leader can edit, others view', async ({ page, request }) => {
    // Create case and progress to Stage 3
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Fill Stage 3 and enable cost required
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    
    // Enable cost required - use label text to find the correct checkbox
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost description');
    
    // Save (not complete yet)
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    // Wait for stage to close (accordion close delay)
    await page.waitForTimeout(500);
    
    // Wait a bit more for content to render
    await page.waitForTimeout(300);
    
    // Assigned technician should still be able to edit
    const estimatedCostInput = page.locator('input[name="estimated_cost"]');
    await expect(estimatedCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Leader should now be able to edit (approve/reject buttons)
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Leader should see approve/reject buttons
    const approveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    const rejectButton = page.locator('button:has-text("Reject")').or(page.locator('button:has-text("reject")'));
    
    // Check if approve/reject buttons are visible (leader can approve/reject)
    const hasApproveReject = await approveButton.count() > 0 || await rejectButton.count() > 0;
    expect(hasApproveReject).toBeTruthy();
    
    // CS should NOT be able to edit
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(estimatedCostInput).not.toBeVisible();
    
    // Cleanup
    await cleanupCase(request, testCaseId);
  });

  test('Stage 3: After approve/reject, assigned technician and CS can edit, leader view only', async ({ page, request }) => {
    // Create case and progress to Stage 3 with cost required
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
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
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);
    
    // Leader approves cost - this will automatically advance Stage 3 to Stage 4
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
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
      
      // Wait for Processing to disappear and stage to advance to Stage 4
      await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.stage-section-title:has-text("Stage 4")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }
    
    // Stage 3 is automatically completed after approval, now technician can edit Stage 4
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const completeButton = page.locator('button:has-text("Complete")');
    await expect(completeButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS should be able to view case details
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // CS should see case details (can view) - stage should be 4 now
    await expect(page.locator('.stage-section-title:has-text("Stage 4")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Leader should only view (no edit buttons)
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Leader should not see edit buttons for Stage 4 after approval
    await expect(completeButton).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 4: Only assigned technician can edit, others view', async ({ page, request }) => {
    // Create case and progress to Stage 4
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Complete Stage 3
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    // Assigned technician should be able to edit Stage 4
    const executionReportTextarea = page.locator('textarea[name="execution_report"]');
    await expect(executionReportTextarea).toBeVisible();
    
    // CS should NOT be able to edit Stage 4
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(executionReportTextarea).not.toBeVisible();
    
    // Leader should NOT be able to edit Stage 4
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(executionReportTextarea).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 5: Only CS can edit initially, leader and technician view', async ({ page, request }) => {
    // Create case and progress to Stage 5
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
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
    
    // CS should be able to edit Stage 5
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    const csNotesTextarea = page.locator('textarea[name="cs_notes"]');
    await expect(csNotesTextarea).toBeVisible();
    
    // Leader should NOT be able to edit Stage 5
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(csNotesTextarea).not.toBeVisible();
    
    // Technician should NOT be able to edit Stage 5
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(csNotesTextarea).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 5: When final cost entered, CS and leader can edit, technician view only', async ({ page, request }) => {
    // Create case with cost required in Stage 3, progress to Stage 5
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 as technician with cost required
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    
    // Enable cost required and save
    await page.locator('label:has-text("Cost Required") input[type="checkbox"]').check();
    await page.locator('input[name="estimated_cost"]').fill('1000');
    await page.locator('textarea[name="cost_description"]').fill('Test cost');
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(1000);
    
    // Leader approves - this will automatically advance Stage 3 to Stage 4
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
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
      
      // Wait for Processing to disappear and stage to advance to Stage 4
      await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
      
      // Wait for case data to reload and Stage 4 to be visible
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.stage-section-title:has-text("Stage 4")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }
    
    // Stage 3 is automatically completed after approval, now complete Stage 4
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // CS enters final cost and saves
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const finalCostInput = page.locator('input[name="final_cost"]');
    await expect(finalCostInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await finalCostInput.fill('950');
    
    // Wait for Save button and click it
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
    
    // Wait for Processing to disappear and page to reload
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // After saving final cost, CS should still be able to edit (stage stays open after save)
    const csNotesTextarea = page.locator('textarea[name="cs_notes"]');
    await expect(csNotesTextarea).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Leader should now be able to edit (approve/reject final cost)
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    // Leader should see approve/reject buttons for final cost
    const finalCostApproveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    await expect(finalCostApproveButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Technician should NOT be able to edit
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await expect(csNotesTextarea).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });

  test('Stage 5: After final cost approve/reject, only CS can edit, leader and technician view', async ({ page, request }) => {
    // Create case with final cost, progress to approval
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-4 with cost required
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
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
    
    // Leader approves Stage 3 cost - this will automatically advance to Stage 4
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
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
      
      // Wait for Processing to disappear and stage to advance to Stage 4
      await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.stage-section-title:has-text("Stage 4")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    }
    
    // Stage 3 is automatically completed after approval, now complete Stage 4
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
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
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Save")').click()
    ]);
    
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // Leader approves final cost
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const finalCostApproveButton = page.locator('button:has-text("Approve")').or(page.locator('button:has-text("approve")'));
    if (await finalCostApproveButton.count() > 0) {
      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}/approve_final_cost`) && 
                       response.request().method() === 'POST',
          { timeout: TIMEOUTS.API_RESPONSE * 2 } // Double timeout for parallel runs
        ),
        finalCostApproveButton.click()
      ]);
      
      // Wait for Processing to disappear
      await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
      await page.waitForLoadState('networkidle');
    }
    
    // After approval, CS should be able to edit (complete stage)
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    const completeButton = page.locator('button:has-text("Complete")');
    await expect(completeButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS completes Stage 5 - this should close the case
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      completeButton.click()
    ]);
    
    // Wait for Processing to disappear
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
    await page.waitForLoadState('networkidle');
    
    // Verify case is closed
    await expect(page.getByRole('status', { name: /Case status: Closed/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Leader should NOT be able to edit (view only)
    await logout(page);
    await loginAs(page, leaderEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await expect(completeButton).not.toBeVisible();
    
    // Technician should NOT be able to edit (view only)
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    
    await expect(completeButton).not.toBeVisible();
    
    // Cleanup - wrap in try-catch to prevent test failures
    try {
      await logout(page).catch(() => {});
      await cleanupCase(request, testCaseId);
    } catch (error) {
      // Ignore cleanup errors - test already passed
    }
  });
});

