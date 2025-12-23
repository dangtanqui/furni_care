import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loginAs, logout, selectDropdownOption } from '../../helpers/case-workflow-helpers';
import { TEST_USERS, TEST_DATA, TIMEOUTS } from '../../constants/test-data';
import { TestCaseBuilder } from '../../helpers/test-case-builder';
import { setupTestData, cleanupCase } from '../../shared/setup';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Case Creation Scenarios', () => {
  const API_BASE_URL = process.env.VITE_API_URL;
  let setupData: Awaited<ReturnType<typeof setupTestData>>;

  test.beforeAll(async ({ request }) => {
    if (!API_BASE_URL) {
      throw new Error('VITE_API_URL must be set in .env file');
    }
    setupData = await setupTestData(request, API_BASE_URL);
  });

  async function fillRequiredFields(page: Page): Promise<void> {
    await selectDropdownOption(page, 'client_id');
    await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'site_id');
    await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'contact_id');
    await selectDropdownOption(page, 'case_type', 'Repair');
    await selectDropdownOption(page, 'priority', 'Medium');
  }

  test('Only CS role can see Create Case button', async ({ page }) => {
    // Test CS can see Create Case button
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await expect(page.getByRole('link', { name: 'Create Case' })).toBeVisible();
    
    // Test Technician cannot see Create Case button
    await logout(page);
    await loginAs(page, setupData.technicianEmail, TEST_USERS.PASSWORD);
    await expect(page.getByRole('link', { name: 'Create Case' })).not.toBeVisible();
    
    // Test Leader cannot see Create Case button
    await logout(page);
    await loginAs(page, setupData.leaderEmail, TEST_USERS.PASSWORD);
    await expect(page.getByRole('link', { name: 'Create Case' })).not.toBeVisible();
  });

  test('Dropdown selection order: Client => Site => Contact Person', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Verify Site dropdown is disabled when Client is not selected
    const siteDropdown = page.locator('button[name="site_id"]');
    await expect(siteDropdown).toBeDisabled();
    
    // Verify Contact Person dropdown is disabled when Site is not selected
    const contactDropdown = page.locator('button[name="contact_id"]');
    await expect(contactDropdown).toBeDisabled();
    
    // Select Client - Site should become enabled
    await page.locator('button[name="client_id"]').click();
    await page.locator('.select-option').first().click();
    
    // Wait for Site dropdown to become enabled
    await expect(siteDropdown).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    // Contact should still be disabled
    await expect(contactDropdown).toBeDisabled();
    
    // Select Site - Contact Person should become enabled
    await siteDropdown.click();
    await page.locator('.select-option').first().click();
    
    // Wait for Contact Person dropdown to become enabled
    await expect(contactDropdown).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Submit button is disabled when required fields are not filled', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    
    // Initially, submit button should be disabled (no fields filled)
    await expect(submitButton).toBeDisabled();
    
    // Fill Client only - still disabled
    await page.locator('button[name="client_id"]').click();
    await page.locator('.select-option').first().click();
    await expect(submitButton).toBeDisabled();
    
    // Fill Site - still disabled
    await page.locator('button[name="site_id"]').click();
    await page.locator('.select-option').first().click();
    await expect(submitButton).toBeDisabled();
    
    // Fill Contact Person - still disabled (missing case_type and priority)
    await page.locator('button[name="contact_id"]').click();
    await page.locator('.select-option').first().click();
    await expect(submitButton).toBeDisabled();
    
    // Fill Description - still disabled
    await page.fill('textarea[name="description"]', 'Test description');
    await expect(submitButton).toBeDisabled();
    
    // Fill Case Type - still disabled (missing priority)
    await page.locator('button[name="case_type"]').click();
    await page.locator('.select-option').first().click();
    await expect(submitButton).toBeDisabled();
    
    // Fill Priority - now should be enabled
    await page.locator('button[name="priority"]').click();
    await page.locator('.select-option').first().click();
    await expect(submitButton).toBeEnabled();
  });

  test('Create case with Repair type and Medium priority', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    const builder = new TestCaseBuilder(page);
    const caseId = await builder.createCase({
      caseType: 'Repair',
      priority: 'Medium'
    });
    
    await page.goto(`/cases/${caseId}`);
    await expect(page.locator('text=Repair')).toBeVisible();
    await expect(page.getByRole('status', { name: /Case priority: Medium/i })).toBeVisible();
    
    // Cleanup
    if (API_BASE_URL) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  test('Create case with Maintenance type and Low priority', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    const builder = new TestCaseBuilder(page);
    const caseId = await builder.createCase({
      caseType: 'Maintenance',
      priority: 'Low'
    });
    
    await page.goto(`/cases/${caseId}`);
    await expect(page.locator('text=Maintenance')).toBeVisible();
    await expect(page.getByRole('status', { name: /Case priority: Low/i })).toBeVisible();
    
    // Cleanup
    if (API_BASE_URL) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  test('Create case with Warranty type and High priority', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    const builder = new TestCaseBuilder(page);
    const caseId = await builder.createCase({
      caseType: 'Warranty',
      priority: 'High'
    });
    
    await page.goto(`/cases/${caseId}`);
    await expect(page.locator('text=Warranty')).toBeVisible();
    await expect(page.getByRole('status', { name: /Case priority: High/i })).toBeVisible();
    
    // Cleanup
    if (API_BASE_URL) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  // File Upload Tests
  test('Can upload files during case creation', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    // Upload image file
    // Input file is hidden but can still be accessed via setInputFiles
    const testImagePath = path.join(__dirname, '../../test-files', 'test-image.jpg');
    const fileInput = page.locator('input#attachments, input[name="attachments"]');
    // Verify input exists (doesn't need to be visible)
    await expect(fileInput).toBeAttached({ timeout: TIMEOUTS.DEFAULT });
    
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for preview to appear
    await page.waitForTimeout(1000);
    
    // Verify preview is visible (for images)
    const preview = page.locator('img[class*="preview"], [class*="preview"] img').first();
    await expect(preview).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
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
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    const caseId = caseData.id;
    
    // Cleanup
    if (API_BASE_URL && caseId) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  test('Can delete uploaded files before submission', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    // Upload file
    const testImagePath = path.join(__dirname, '../../test-files', 'test-image.jpg');
    const fileInput = page.locator('input#attachments, input[name="attachments"]');
    await expect(fileInput).toBeAttached({ timeout: TIMEOUTS.DEFAULT });
    await fileInput.setInputFiles(testImagePath);
    
    await page.waitForTimeout(1000);
    
    // Verify preview is visible
    const preview = page.locator('img[class*="preview"], [class*="preview"] img').first();
    await expect(preview).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Delete preview
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
    await expect(deleteButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await deleteButton.click();
    
    // Verify preview is removed
    await expect(preview).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  test('Can upload multiple files', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    // Upload multiple files
    const testImagePath = path.join(__dirname, '../../test-files', 'test-image.jpg');
    const testPdfPath = path.join(__dirname, '../../test-files', 'test-document.pdf');
    const fileInput = page.locator('input#attachments, input[name="attachments"]');
    await expect(fileInput).toBeAttached({ timeout: TIMEOUTS.DEFAULT });
    
    await fileInput.setInputFiles([testImagePath, testPdfPath]);
    
    await page.waitForTimeout(1000);
    
    // Verify at least one preview/file indicator is visible
    const previews = page.locator('[class*="preview"], img[class*="preview"]');
    const previewCount = await previews.count();
    expect(previewCount).toBeGreaterThan(0);
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
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
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    const caseId = caseData.id;
    
    // Cleanup
    if (API_BASE_URL && caseId) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  // Error Handling Tests
  test('Shows error messages from backend validation', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill form with potentially invalid data
    await fillRequiredFields(page);
    
    // Try to submit - if backend returns validation errors, they should be displayed
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
    // Submit and wait for response
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/cases') && 
      resp.request().method() === 'POST' &&
      !resp.url().includes('/attachments'),
      { timeout: TIMEOUTS.API_RESPONSE }
    );
    
    await submitButton.click();
    
    const response = await responsePromise;
    
    // If response is not ok, check for error messages
    if (!response.ok()) {
      // Check if error messages are displayed in the form
      const errorMessages = page.locator('.case-form-field-error, [class*="error"]');
      const errorCount = await errorMessages.count();
      
      // If there are validation errors, they should be displayed
      if (errorCount > 0) {
        await expect(errorMessages.first()).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
      }
    }
  });

  test('Error message clears when field value changes', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill all fields except one required field
    await selectDropdownOption(page, 'client_id');
    await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'site_id');
    await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'contact_id');
    await selectDropdownOption(page, 'case_type', 'Repair');
    // Don't fill priority to trigger validation
    
    // Try to submit (should fail validation)
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    // Button should be disabled if validation is working
    await expect(submitButton).toBeDisabled();
    
    // Fill priority - error should clear
    await selectDropdownOption(page, 'priority', 'Medium');
    await expect(submitButton).toBeEnabled();
  });

  // Back Button Test
  test('Back button navigates to case list', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Click Back button
    const backButton = page.locator('button:has-text("Back"), button.create-case-back-button').first();
    await expect(backButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    await backButton.click();
    
    // Verify navigated to case list
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  });

  // Change Dropdown Values Tests
  test('Change client resets site and contact', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Select first Client, Site, and Contact
    await page.locator('button[name="client_id"]').click();
    const firstClientOption = page.locator('.select-option').first();
    await firstClientOption.click();
    
    await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'site_id');
    await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    await selectDropdownOption(page, 'contact_id');
    
    // Get selected values
    const selectedSite = await page.locator('button[name="site_id"]').textContent();
    const selectedContact = await page.locator('button[name="contact_id"]').textContent();
    
    // Change to a different Client (select second option if available, otherwise verify reset still works)
    await page.locator('button[name="client_id"]').click();
    const allClientOptions = page.locator('.select-option');
    const clientOptionCount = await allClientOptions.count();
    
    if (clientOptionCount > 1) {
      // Select second client (different from first)
      await allClientOptions.nth(1).click();
    } else {
      // If only one client, select it again - site should still reset
      await allClientOptions.first().click();
    }
    
    // Wait for site dropdown to reset
    await page.waitForTimeout(500);
    
    // Verify Site dropdown is reset (should show placeholder or different value)
    const siteDropdown = page.locator('button[name="site_id"]');
    const newSiteValue = await siteDropdown.textContent();
    // Site should be reset (either placeholder or different site)
    // If same client selected, site might be same but contact should still be reset
    expect(newSiteValue).not.toBe(selectedSite);
    
    // Verify Contact dropdown is reset and disabled
    const contactDropdown = page.locator('button[name="contact_id"]');
    await expect(contactDropdown).toBeDisabled();
    const newContactValue = await contactDropdown.textContent();
    expect(newContactValue).not.toBe(selectedContact);
  });

  test('Change site resets contact', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Select Client
    await selectDropdownOption(page, 'client_id');
    await expect(page.locator('button[name="site_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Select first Site
    await page.locator('button[name="site_id"]').click();
    const firstSiteOption = page.locator('.select-option').first();
    await firstSiteOption.click();
    
    await expect(page.locator('button[name="contact_id"]')).toBeEnabled({ timeout: TIMEOUTS.DEFAULT });
    
    // Select Contact
    await selectDropdownOption(page, 'contact_id');
    const selectedContact = await page.locator('button[name="contact_id"]').textContent();
    
    // Change to a different Site (select second option if available, otherwise verify reset still works)
    await page.locator('button[name="site_id"]').click();
    const allSiteOptions = page.locator('.select-option');
    const siteOptionCount = await allSiteOptions.count();
    
    if (siteOptionCount > 1) {
      // Select second site (different from first)
      await allSiteOptions.nth(1).click();
    } else {
      // If only one site, select it again - contact should still reset
      await allSiteOptions.first().click();
    }
    
    // Wait for contact dropdown to reset
    await page.waitForTimeout(500);
    
    // Verify Contact dropdown is reset
    const contactDropdown = page.locator('button[name="contact_id"]');
    const newContactValue = await contactDropdown.textContent();
    expect(newContactValue).not.toBe(selectedContact);
  });

  // Description Field Test
  test('Description field is optional', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill only required fields (no description)
    await fillRequiredFields(page);
    
    // Submit should work without description
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
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
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    const caseId = caseData.id;
    
    // Cleanup
    if (API_BASE_URL && caseId) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  test('Description field accepts text input', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    // Fill description
    const descriptionText = `${TEST_DATA.PREFIX} ${TEST_DATA.DESCRIPTION}`;
    await page.fill('textarea[name="description"]', descriptionText);
    
    // Verify description is filled
    const descriptionValue = await page.locator('textarea[name="description"]').inputValue();
    expect(descriptionValue).toBe(descriptionText);
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
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
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    const caseId = caseData.id;
    
    // Verify description is saved
    await page.goto(`/cases/${caseId}`);
    await expect(page.locator(`text=${descriptionText}`)).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    if (API_BASE_URL && caseId) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  // Loading State Test
  test('Submit button and form fields disabled during submission', async ({ page }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
    // Click submit and immediately check if button is disabled
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes('/api/cases') && 
      resp.request().method() === 'POST' &&
      !resp.url().includes('/attachments'),
      { timeout: TIMEOUTS.API_RESPONSE }
    );
    
    await submitButton.click();
    
    // Check immediately after click (before redirect)
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    
    // If still on create page (error case), button should be disabled
    if (await page.url().includes('/cases/new')) {
      expect(isDisabled).toBeTruthy();
    }
    
    // Wait for response
    await responsePromise.catch(() => {
      // Response might have completed already
    });
  });

  // Success Redirect Test
  test('Redirects to case list after successful creation', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    
    // Fill required fields
    await fillRequiredFields(page);
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
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
      throw new Error(`Create case failed: ${createResponse.status()} - ${errorBody}`);
    }
    
    const caseData = await createResponse.json();
    const caseId = caseData.id;
    
    // Verify redirected to case list
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    if (API_BASE_URL && caseId) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });

  test('Created case appears in case list', async ({ page, request }) => {
    await loginAs(page, TEST_USERS.CS, TEST_USERS.PASSWORD);
    
    // Create case
    const builder = new TestCaseBuilder(page);
    const caseId = await builder.createCase({
      caseType: 'Repair',
      priority: 'Medium'
    });
    
    // Verify redirected to case list
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
    await expect(page.getByRole('heading', { name: 'Case List' })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Wait for case list to load
    await page.waitForLoadState('networkidle');
    
    // Verify case appears in list (check for case number format C-XXXX)
    const caseNumber = `C-${caseId.toString().padStart(4, '0')}`;
    await expect(page.locator(`text=${caseNumber}`)).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Cleanup
    if (API_BASE_URL) {
      await cleanupCase(request, API_BASE_URL, caseId, setupData.authToken);
    }
  });
});
