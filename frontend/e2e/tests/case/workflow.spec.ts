import { test, expect } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, waitForCaseStatus, selectRating } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';

test.describe('Case Workflow E2E Test', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  
  let authToken: string;
  let clientId: number;
  let siteId: number;
  let technicianEmail: string;
  let technicianName: string;
  let technicians: Array<{ id: number; name: string; email: string }>;
  let caseId: number;

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
    if (!loginData.token || !loginData.user) {
      throw new Error('Invalid login response');
    }
    authToken = loginData.token;

    const clientsResponse = await request.get(`${API_BASE_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!clientsResponse.ok()) {
      throw new Error(`Failed to fetch clients: ${clientsResponse.status()}`);
    }

    const clients = await clientsResponse.json();
    if (!clients || clients.length === 0) {
      throw new Error('No clients found in test database');
    }
    clientId = clients[0].id;
    
    const sitesResponse = await request.get(`${API_BASE_URL}/api/clients/${clientId}/sites`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!sitesResponse.ok()) {
      throw new Error(`Failed to fetch sites: ${sitesResponse.status()}`);
    }

    const sites = await sitesResponse.json();
    if (!sites || sites.length === 0) {
      throw new Error('No sites found in test database');
    }
    siteId = sites[0].id;
    
    const contactsResponse = await request.get(`${API_BASE_URL}/api/sites/${siteId}/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!contactsResponse.ok()) {
      throw new Error(`Failed to fetch contacts: ${contactsResponse.status()}`);
    }

    const techniciansResponse = await request.get(`${API_BASE_URL}/api/users/technicians`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!techniciansResponse.ok()) {
      throw new Error(`Failed to fetch technicians: ${techniciansResponse.status()}`);
    }

    technicians = await techniciansResponse.json();
    if (!technicians || technicians.length === 0) {
      throw new Error('No technicians found in test database');
    }
    
    const selectedTech = technicians[0];
    technicianEmail = selectedTech.email;
    technicianName = selectedTech.name;
  });

  test('Complete case workflow from login to closing', async ({ page }) => {
    // 1. Login as CS
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // 2. Navigate to Create Case
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible();

    // 3. Fill case form - Stage 1
    const clientSelectButton = page.locator('button[name="client_id"]');
    await expect(clientSelectButton).toBeEnabled();
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
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      submitButton.click()
    ]);
    
    if (!createResponse.ok()) {
      throw new Error(`Create case failed: ${createResponse.status()}`);
    }
    
    const caseData = await createResponse.json();
    caseId = caseData.id;
    
    await page.goto(`/cases/${caseId}`);
    
    // 4. Complete Stage 1 - Assign technician
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    
    await completeStage(page, caseId);
    
    // 5. Logout CS and login as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${caseId}`);
    
    // 6. Complete Stage 2 - Investigation
    const investigationReportTextarea = page.locator('textarea[name="investigation_report"]');
    await expect(investigationReportTextarea).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await investigationReportTextarea.fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, caseId);
    
    // 7. Complete Stage 3 - Solution & Plan
    const rootCauseInput = page.locator('input[name="root_cause"]');
    await expect(rootCauseInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await rootCauseInput.fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    
    const plannedDateInput = page.locator('input[type="date"][name="planned_execution_date"]');
    await plannedDateInput.fill('2024-12-31');
    
    await completeStage(page, caseId);
    
    // 8. Complete Stage 4 - Execution
    await page.fill('textarea[name="execution_report"]', `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    // client_signature is a canvas, not a textarea - skip filling it
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    
    await selectRating(page, 4, 5);
    await completeStage(page, caseId);
    
    // 9. Logout technician and login as CS for Stage 5
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${caseId}`);
    
    // 10. Complete Stage 5 - Closing
    await page.fill('textarea[name="cs_notes"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CS_NOTES}`);
    await page.fill('textarea[name="final_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.FINAL_FEEDBACK}`);
    
    await selectRating(page, 5, 5);
    await completeStage(page, caseId);
    
    // 11. Verify case completed
    await waitForCaseStatus(page, 'Closed');
  });

  test.afterAll(async ({ request }) => {
    if (caseId && authToken && API_BASE_URL) {
      try {
        await request.delete(`${API_BASE_URL}/api/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error) {
        // Log error but don't fail test
        console.error('Failed to cleanup test case:', error);
      }
    }
  });
});
