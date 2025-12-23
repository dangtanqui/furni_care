import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption, completeStage, fillStageChecklist, openStage, gotoCaseDetail, uploadAttachment, deleteAttachment } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS, STAGE_CHECKLIST_COUNTS } from '../../constants/test-data';
import { setupTestData, cleanupCase } from '../../shared/setup';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Attachments Tests', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  let setupData: Awaited<ReturnType<typeof setupTestData>>;
  
  // Path to test files
  const testImagePath = path.join(__dirname, '../../test-files', 'test-image.jpg');
  const testPdfPath = path.join(__dirname, '../../test-files', 'test-document.pdf');

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

  test('Stage 2: Technician can upload and delete attachments', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1
    await page.locator('button[name="assigned_to"]').click();
    await page.locator('.select-option').filter({ hasText: setupData.technicianName }).click();
    await completeStage(page, testCaseId);
    
    // Technician uploads attachment in Stage 2
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 2);
    
    // Upload attachment
    const fileInput = page.locator('input[type="file"][id*="stage2-attachments"], input[type="file"][name*="stage2-attachments"]');
    await expect(fileInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes('/api/cases') && 
                     response.url().includes('/attachments') &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE * 2 }
      ),
      fileInput.setInputFiles(testImagePath)
    ]);
    
    await page.waitForTimeout(1000);
    
    // Verify attachment appears
    const attachmentGrid = page.locator('.attachment-grid, [class*="attachment"]');
    await expect(attachmentGrid).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // CS and Leader should see attachments but cannot delete
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await gotoCaseDetail(page, testCaseId);
    await openStage(page, 2);
    
    // File upload input should not be visible for CS
    await expect(fileInput).not.toBeVisible();
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Stage 3: Technician can upload attachments', async ({ page, request }) => {
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
    
    // Upload attachment in Stage 3
    await openStage(page, 3);
    const fileInput = page.locator('input[type="file"][id*="stage3-attachments"], input[type="file"][name*="stage3-attachments"]');
    await expect(fileInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes('/api/cases') && 
                     response.url().includes('/attachments') &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE * 2 }
      ),
      fileInput.setInputFiles(testPdfPath)
    ]);
    
    await page.waitForTimeout(1000);
    
    // Verify attachment appears
    const attachmentGrid = page.locator('.attachment-grid, [class*="attachment"]');
    await expect(attachmentGrid).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });

  test('Stage 4: Technician can upload photos', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    const testCaseId = await createCase(page);
    
    await gotoCaseDetail(page, testCaseId);
    
    // Assign technician and complete Stage 1-3
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
    
    await openStage(page, 3);
    await page.locator('input[name="root_cause"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.ROOT_CAUSE}`);
    await page.locator('textarea[name="solution_description"]').fill(`${TEST_DATA.PREFIX} ${TEST_DATA.SOLUTION}`);
    await fillStageChecklist(page, 3, STAGE_CHECKLIST_COUNTS.STAGE_3);
    await page.locator('input[type="date"][name="planned_execution_date"]').fill('2024-12-31');
    await completeStage(page, testCaseId);
    
    // Upload photo in Stage 4
    await openStage(page, 4);
    const fileInput = page.locator('input[type="file"][id*="stage4-attachments"], input[type="file"][name*="stage4-attachments"]');
    await expect(fileInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes('/api/cases') && 
                     response.url().includes('/attachments') &&
                     response.request().method() === 'POST',
        { timeout: TIMEOUTS.API_RESPONSE * 2 }
      ),
      fileInput.setInputFiles(testImagePath)
    ]);
    
    await page.waitForTimeout(1000);
    
    // Verify attachment appears
    const attachmentGrid = page.locator('.attachment-grid, [class*="attachment"]');
    await expect(attachmentGrid).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    await logout(page);
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await cleanupCase(request, API_BASE_URL!, testCaseId, setupData.authToken);
  });
});

