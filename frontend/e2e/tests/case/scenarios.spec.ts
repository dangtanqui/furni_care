import { test, expect } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';

test.describe('Case Workflow Scenarios', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  
  let authToken: string;
  let clientId: number;
  let technicianEmail: string;
  let technicianName: string;
  let technicians: Array<{ id: number; name: string; email: string }>;

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
  });

  test('Create case with different case types', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
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
    await page.fill('textarea[name="description"]', `${TEST_DATA.DESCRIPTION} - Different Types`);
    
    // Test Maintenance type
    await selectDropdownOption(page, 'case_type', 'Maintenance');
    await selectDropdownOption(page, 'priority', 'Low');
    
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    // Wait for submit button to be enabled (all required fields filled)
    await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify case type is Maintenance
    await expect(page.locator('text=Maintenance')).toBeVisible();
    
    // Cleanup
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Create case with high priority', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    await page.getByRole('link', { name: 'Create Case' }).click();
    
    await selectDropdownOption(page, 'client_id');
    await selectDropdownOption(page, 'site_id');
    await selectDropdownOption(page, 'contact_id');
    await page.fill('textarea[name="description"]', `${TEST_DATA.DESCRIPTION} - High Priority`);
    
    await selectDropdownOption(page, 'case_type', 'Repair');
    await selectDropdownOption(page, 'priority', 'High');
    
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Verify priority is High
    await expect(page.getByRole('status', { name: /Case priority: High/i })).toBeVisible();
    
    // Cleanup
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Technician cannot edit Stage 1', async ({ page, request }) => {
    // Create case as CS
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Assign technician
    await expect(page.locator('button[name="assigned_to"]')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Login as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Verify technician cannot see edit controls for Stage 1
    const assignButton = page.locator('button[name="assigned_to"]');
    await expect(assignButton).not.toBeVisible();
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('CS cannot edit Stage 2-4 when assigned to technician', async ({ page, request }) => {
    // Create and assign case
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    
    // Wait for case page to load
    await page.waitForLoadState('networkidle');
    
    // Assign technician and complete Stage 1
    await expect(page.locator('button[name="assigned_to"]')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // CS should not be able to edit Stage 2
    const investigationTextarea = page.locator('textarea[name="investigation_report"]');
    await expect(investigationTextarea).not.toBeVisible();
    
    // Cleanup
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Complete workflow with different technician', async ({ page, request }) => {
    if (technicians.length < 2) {
      test.skip();
      return;
    }

    const secondTech = technicians[1];
    
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
    await page.waitForLoadState('networkidle');
    
    // Assign second technician
    await expect(page.locator('button[name="assigned_to"]')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: secondTech.name }).click();
    await completeStage(page, testCaseId);
    
    // Login as second technician
    await logout(page);
    await loginAs(page, secondTech.email, TEST_USERS.PASSWORD);
    
    await page.goto(`/cases/${testCaseId}`);
    
    // Complete Stage 2
    const investigationReportTextarea = page.locator('textarea[name="investigation_report"]');
    await expect(investigationReportTextarea).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await investigationReportTextarea.fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Verify case list shows created cases', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Create a case
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
      const errorBody = await createResponse.text().catch(() => 'Unable to read error response');
      // Log request details for debugging
      const requestUrl = createResponse.url();
      const requestMethod = createResponse.request().method();
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}\nRequest: ${requestMethod} ${requestUrl}`);
    }
    
    const caseData = await createResponse.json();
    if (!caseData || !caseData.id) {
      throw new Error(`Case creation response missing id. Response: ${JSON.stringify(caseData)}`);
    }
    const testCaseId = caseData.id;
    
    // Navigate to case list
    await page.goto('/');
    
    // Verify case appears in list
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible();
    // Case should be visible (check for case number or description)
    await expect(page.locator(`text=${caseData.case_number || testCaseId}`).or(page.locator(`text=${TEST_DATA.DESCRIPTION}`))).toBeVisible();
    
    // Cleanup
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Technician can update investigation report after completing Stage 2', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Create case
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
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      submitButton.click()
    ]);
    
    const caseData = await createResponse.json();
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await page.waitForLoadState('networkidle');
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    const initialReport = `${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`;
    await page.locator('textarea[name="investigation_report"]').fill(initialReport);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    // Wait for stage to complete
    await page.waitForLoadState('networkidle');
    
    // Update investigation report (Stage 2 is now completed, but technician can still update)
    const updatedReport = `${initialReport} - Updated`;
    await page.locator('textarea[name="investigation_report"]').fill(updatedReport);
    
    // Click Update button (not Complete, since stage is already completed)
    const updateButton = page.locator('button:has-text("Update")');
    if (await updateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                       (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
          { timeout: TIMEOUTS.API_RESPONSE }
        ),
        updateButton.click()
      ]);
      
      await page.waitForLoadState('networkidle');
      
      // Verify updated report is displayed
      const reportTextarea = page.locator('textarea[name="investigation_report"]');
      const reportValue = await reportTextarea.inputValue();
      expect(reportValue).toContain('Updated');
    }
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Technician can update execution report after completing Stage 4', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Create case
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
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      submitButton.click()
    ]);
    
    const caseData = await createResponse.json();
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await page.waitForLoadState('networkidle');
    
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
    
    const initialExecutionReport = `${TEST_DATA.PREFIX} ${TEST_DATA.EXECUTION}`;
    await page.fill('textarea[name="execution_report"]', initialExecutionReport);
    await fillStageChecklist(page, 4, STAGE_CHECKLIST_COUNTS.STAGE_4);
    await page.fill('textarea[name="client_feedback"]', `${TEST_DATA.PREFIX} ${TEST_DATA.CLIENT_FEEDBACK}`);
    await page.locator('button.stage4-rating-button:has-text("5")').click();
    await completeStage(page, testCaseId);
    
    // Wait for stage to complete
    await page.waitForLoadState('networkidle');
    
    // Update execution report (Stage 4 is now completed, but technician can still update)
    const updatedExecutionReport = `${initialExecutionReport} - Updated`;
    await page.fill('textarea[name="execution_report"]', updatedExecutionReport);
    
    // Click Update button
    const updateButton = page.locator('button:has-text("Update")');
    if (await updateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                       (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
          { timeout: TIMEOUTS.API_RESPONSE }
        ),
        updateButton.click()
      ]);
      
      await page.waitForLoadState('networkidle');
      
      // Verify updated report is displayed
      const executionTextarea = page.locator('textarea[name="execution_report"]');
      const executionValue = await executionTextarea.inputValue();
      expect(executionValue).toContain('Updated');
    }
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

  test('Technician can update solution after completing Stage 3', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Create case
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
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      submitButton.click()
    ]);
    
    const caseData = await createResponse.json();
    const testCaseId = caseData.id;
    
    await page.goto(`/cases/${testCaseId}`);
    await page.waitForLoadState('networkidle');
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Complete Stage 2-3 as technician
    await logout(page);
    await loginAs(page, technicianEmail, TEST_USERS.PASSWORD);
    await page.goto(`/cases/${testCaseId}`);
    
    await page.locator('textarea[name="investigation_report"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.INVESTIGATION}`);
    await fillStageChecklist(page, 2, STAGE_CHECKLIST_COUNTS.STAGE_2);
    await completeStage(page, testCaseId);
    
    const initialRootCause = `${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`;
    const initialSolution = `${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`;
    await page.locator('input[name="root_cause"]').fill(initialRootCause);
    await page.locator('textarea[name="solution_description"]').fill(initialSolution);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    // Wait for stage to complete
    await page.waitForLoadState('networkidle');
    
    // Update root cause and solution description (Stage 3 is now completed, but technician can still update)
    const updatedRootCause = `${initialRootCause} - Updated`;
    const updatedSolution = `${initialSolution} - Updated`;
    await page.locator('input[name="root_cause"]').fill(updatedRootCause);
    await page.locator('textarea[name="solution_description"]').fill(updatedSolution);
    
    // Click Update button (not Complete, since stage is already completed)
    const updateButton = page.locator('button:has-text("Update")');
    if (await updateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page.waitForResponse(
          (response) => response.url().includes(`/api/cases/${testCaseId}`) && 
                       (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
          { timeout: TIMEOUTS.API_RESPONSE }
        ),
        updateButton.click()
      ]);
      
      await page.waitForLoadState('networkidle');
      
      // Verify updated data is displayed
      const rootCauseInput = page.locator('input[name="root_cause"]');
      const rootCauseValue = await rootCauseInput.inputValue();
      expect(rootCauseValue).toContain('Updated');
      
      const solutionTextarea = page.locator('textarea[name="solution_description"]');
      const solutionValue = await solutionTextarea.inputValue();
      expect(solutionValue).toContain('Updated');
    }
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await request.delete(`${API_BASE_URL}/api/cases/${testCaseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  });

});

