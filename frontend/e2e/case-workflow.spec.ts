import { test, expect } from '@playwright/test';

test.describe('Case Workflow E2E Test', () => {
  const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';
  
  let authToken: string;
  let clientId: number;
  let siteId: number;
  let technicianEmail: string;
  let technicianName: string;
  let technicianId: number;
  let technicians: Array<{ id: number; name: string; email: string }>;
  let caseId: number;

  test.beforeAll(async ({ request }) => {
    // Login với account có sẵn (hoặc tạo mới nếu cần)
    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: 'cs@demo.com',
        password: 'password'
      }
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      // Playwright request.json() returns response body directly (not wrapped in 'data')
      // Backend returns { token: "...", user: {...} }
      if (!loginData.token || !loginData.user) {
        const responseText = await loginResponse.text();
        throw new Error(`Invalid login response structure. Response: ${responseText}`);
      }
      authToken = loginData.token;
    } else {
      const errorText = await loginResponse.text();
      throw new Error(`Failed to login (${loginResponse.status()}): ${errorText}. Make sure backend is running and test account exists.`);
    }

    // Lấy dữ liệu test (clients, sites, contacts, technicians)
    const clientsResponse = await request.get(`${API_BASE_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const clients = await clientsResponse.json();
    if (clients.length > 0) {
      clientId = clients[0].id;
      
      const sitesResponse = await request.get(`${API_BASE_URL}/api/clients/${clientId}/sites`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const sites = await sitesResponse.json();
      if (sites.length > 0) {
        siteId = sites[0].id;
        
        // Get contacts to ensure they exist (used by UI selection)
        await request.get(`${API_BASE_URL}/api/sites/${siteId}/contacts`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        // Contacts loaded - UI will select from dropdown
      }
    }

    // Lấy technicians
    const techniciansResponse = await request.get(`${API_BASE_URL}/api/users/technicians`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    technicians = await techniciansResponse.json();
    console.log('Technicians from API:', JSON.stringify(technicians, null, 2));
    if (technicians.length > 0) {
      // Use first technician
      const selectedTech = technicians[0];
      technicianEmail = selectedTech.email || 'tech@demo.com';
      technicianName = selectedTech.name || 'Tech Demo';
      technicianId = selectedTech.id;
      console.log(`Selected technician: ${technicianName} (${technicianEmail}, ID: ${technicianId})`);
    } else {
      // Fallback to default test technician account
      technicianEmail = 'tech@demo.com';
      technicianName = 'Tech Demo';
      technicianId = 0; // Will be set when selecting from dropdown
      technicians = [];
    }
  });

  test('Complete case workflow from login to closing', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    
    await page.fill('input[type="email"]', 'cs@demo.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // 2. Navigate to Create Case
    await page.getByRole('link', { name: 'Create Case' }).click();
    await expect(page).toHaveURL(/.*cases\/new/);
    await expect(page.getByRole('heading', { name: 'Create New Case' })).toBeVisible();

    // 3. Fill case form - Stage 1
    // Select Client - click button by name attribute
    const clientSelectButton = page.locator('button[name="client_id"]');
    await expect(clientSelectButton).toBeEnabled();
    await clientSelectButton.click();
    
    // Wait for dropdown options to appear
    const clientOptions = page.locator('.select-option').first();
    await expect(clientOptions).toBeVisible({ timeout: 5000 });
    await clientOptions.click();
    
    // Wait for site dropdown to be enabled (API call to load sites)
    const siteSelectButton = page.locator('button[name="site_id"]');
    await expect(siteSelectButton).toBeEnabled({ timeout: 10000 });
    
    // Select Site
    await siteSelectButton.click();
    const siteOptions = page.locator('.select-option').first();
    await expect(siteOptions).toBeVisible({ timeout: 5000 });
    await siteOptions.click();
    
    // Wait for contact dropdown to be enabled (API call to load contacts)
    const contactSelectButton = page.locator('button[name="contact_id"]');
    await expect(contactSelectButton).toBeEnabled({ timeout: 10000 });
    
    // Select Contact
    await contactSelectButton.click();
    const contactOptions = page.locator('.select-option').first();
    await expect(contactOptions).toBeVisible({ timeout: 5000 });
    await contactOptions.click();

    // Fill description
    await page.fill('textarea[name="description"]', 'E2E Test Case - Automated testing');
    
    // Remove any existing uploaded files (from previous test runs)
    // Snapshot shows: button "Delete image 1"
    const deleteButtons = page.locator('button:has-text("Delete image")');
    const deleteCount = await deleteButtons.count();
    for (let i = 0; i < deleteCount; i++) {
      const firstDeleteButton = deleteButtons.first();
      if (await firstDeleteButton.isVisible()) {
        await firstDeleteButton.click();
        await page.waitForTimeout(300); // Wait for deletion animation
      }
    }
    
    // Select Case Type
    const caseTypeButton = page.locator('button[name="case_type"]');
    await caseTypeButton.click();
    await page.waitForTimeout(300);
    await page.locator('.select-option:has-text("Repair")').click();
    await page.waitForTimeout(300);
    
    // Select Priority
    const priorityButton = page.locator('button[name="priority"]');
    await priorityButton.click();
    await page.waitForTimeout(300);
    await page.locator('.select-option:has-text("Medium")').click();
    await page.waitForTimeout(300);
    
    // Verify form is valid before submitting
    const submitButton = page.locator('button[type="submit"]:has-text("Submit")');
    await expect(submitButton).toBeEnabled();
    
    // Check for any validation errors before submitting
    const errorMessages = page.locator('.case-form-field-error, .login-error');
    const errorCount = await errorMessages.count();
    if (errorCount > 0) {
      const errorTexts = await errorMessages.allTextContents();
      throw new Error(`Form validation errors: ${errorTexts.join(', ')}`);
    }
    
    // Wait for create case API response first
    const [createResponse] = await Promise.all([
      page.waitForResponse(resp => 
        resp.url().includes('/api/cases') && 
        resp.request().method() === 'POST' &&
        !resp.url().includes('/attachments'),
        { timeout: 10000 }
      ),
      submitButton.click()
    ]);
    
    // Check if create case API call was successful
    if (!createResponse.ok()) {
      const errorData = await createResponse.json();
      // Check for form errors after failed submit
      const formErrors = await errorMessages.allTextContents();
      throw new Error(`Create case API call failed (${createResponse.status()}): ${JSON.stringify(errorData)}. Form errors: ${formErrors.join(', ')}`);
    }
    
    const caseData = await createResponse.json();
    // Response structure: { id: number, ... } (direct from API, not wrapped in 'data')
    const createdCaseId = caseData.id || caseData.data?.id;
    
    if (!createdCaseId) {
      throw new Error(`Case ID not found in response: ${JSON.stringify(caseData)}`);
    }
    
    // Store case ID for cleanup
    caseId = createdCaseId;
    
    // After successful submit, navigation should happen
    // But if there were files, upload might block navigation, so navigate directly to case
    try {
      await page.waitForURL('/', { timeout: 5000 });
      // Navigation succeeded, now go to case
      await page.goto(`/cases/${createdCaseId}`);
    } catch {
      // Navigation didn't happen (likely due to upload), navigate directly to case
      await page.goto(`/cases/${createdCaseId}`);
    }
    
    // 4. Verify case created and navigate to case details
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: 10000 });
    
    // Verify Stage 1 is visible (use class selector to avoid strict mode violation)
    const stage1Title = page.locator('.stage-section-title:has-text("Stage 1")');
    await expect(stage1Title).toBeVisible();
    
    // 5. Complete Stage 1 - Assign technician
    // Check if Stage 1 is already expanded, if not click to expand
    const stage1Content = page.locator('.stage-section-content').first();
    const hasHiddenClass = await stage1Content.evaluate((el) => {
      return el.classList.contains('stage-section-content-hidden');
    });
    
    if (hasHiddenClass) {
      const stage1Header = page.locator('.stage-section-header').first();
      await stage1Header.click();
      // Wait for hidden class to be removed
      await expect(stage1Content).not.toHaveClass('stage-section-content-hidden', { timeout: 5000 });
    }
    
    // Now verify content is visible (after class is removed)
    await expect(stage1Content).toBeVisible({ timeout: 5000 });
    
    // Select technician - use button selector with name attribute
    // Select the technician that matches technicianName from beforeAll
    const assignTechnicianButton = page.locator('button[name="assigned_to"]');
    await expect(assignTechnicianButton).toBeVisible({ timeout: 5000 });
    await expect(assignTechnicianButton).toBeEnabled();
    await assignTechnicianButton.click();
    
    // Wait for dropdown options to appear and select technician by name
    // Dropdown displays technician name as label, so find option with matching text
    await page.waitForTimeout(300); // Wait for dropdown to open
    
    // Get all available options first
    const allOptions = page.locator('.select-option');
    const optionCount = await allOptions.count();
    console.log(`Found ${optionCount} technician options in dropdown`);
    
    // Get all option texts to debug
    const optionTexts: string[] = [];
    for (let i = 0; i < optionCount; i++) {
      const text = await allOptions.nth(i).textContent();
      if (text) optionTexts.push(text.trim());
    }
    console.log(`Available options:`, optionTexts);
    console.log(`Looking for: "${technicianName}"`);
    
    // Find option that matches technicianName (normalize whitespace and case)
    const normalizedSearchName = technicianName.trim().toLowerCase();
    let selectedOption = null;
    let selectedIndex = -1;
    
    for (let i = 0; i < optionCount; i++) {
      const option = allOptions.nth(i);
      const optionText = await option.textContent();
      const normalizedOptionText = optionText?.trim().toLowerCase() || '';
      
      if (normalizedOptionText === normalizedSearchName) {
        selectedOption = option;
        selectedIndex = i;
        console.log(`✅ Found exact match at index ${i}: "${optionText}"`);
        break;
      }
    }
    
    // If exact match not found, try partial match
    if (!selectedOption) {
      for (let i = 0; i < optionCount; i++) {
        const option = allOptions.nth(i);
        const optionText = await option.textContent();
        const normalizedOptionText = optionText?.trim().toLowerCase() || '';
        
        if (normalizedOptionText.includes(normalizedSearchName) || normalizedSearchName.includes(normalizedOptionText)) {
          selectedOption = option;
          selectedIndex = i;
          console.log(`⚠️ Found partial match at index ${i}: "${optionText}"`);
          break;
        }
      }
    }
    
    // Fallback: select first option if no match found
    if (!selectedOption) {
      selectedOption = allOptions.first();
      selectedIndex = 0;
      console.warn(`⚠️ No match found for "${technicianName}", selecting first option instead`);
    }
    
    await expect(selectedOption).toBeVisible({ timeout: 5000 });
    
    // Get the selected technician's name BEFORE clicking
    const selectedName = await selectedOption.textContent();
    const selectedNameTrimmed = selectedName?.trim() || '';
    
    console.log(`Selected option - Name: "${selectedNameTrimmed}"`);
    console.log(`Available technicians:`, technicians.map((t: any) => ({ id: t.id, name: t.name, email: t.email })));
    
    // Match technician by name (case-insensitive, normalize whitespace)
    const normalizedSelectedName = selectedNameTrimmed.toLowerCase().replace(/\s+/g, '');
    const matchingTech = technicians.find((t: any) => {
      const normalizedTechName = t.name?.toLowerCase().replace(/\s+/g, '') || '';
      return normalizedTechName === normalizedSelectedName;
    });
    
    if (matchingTech && matchingTech.email) {
      technicianId = matchingTech.id;
      technicianEmail = matchingTech.email;
      technicianName = matchingTech.name;
      console.log(`✅ Matched technician by name: ${technicianName} (${technicianEmail}, ID: ${technicianId})`);
    } else {
      console.warn(`⚠️ Could not find matching technician for "${selectedNameTrimmed}"`);
      console.warn(`   Available names:`, technicians.map((t: any) => t.name));
      // Fallback: use first technician
      if (technicians.length > 0) {
        technicianId = technicians[0].id;
        technicianEmail = technicians[0].email || 'tech@demo.com';
        technicianName = technicians[0].name || 'Tech Demo';
        console.warn(`⚠️ Using fallback technician: ${technicianName} (${technicianEmail})`);
      }
    }
    
    console.log(`🔐 Will login with: ${technicianEmail} (${technicianName}, ID: ${technicianId})`);
    
    // Click the selected option
    await selectedOption.click();
    
    // Wait a bit for the selection to be processed
    await page.waitForTimeout(200);
    
    // Verify the selection was applied by checking the button text
    const buttonText = await assignTechnicianButton.textContent();
    console.log(`Button text after selection: "${buttonText}"`);
    
    // Click Complete button and wait for API response
    const [completeResponse] = await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${caseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: 10000 }
      ),
      page.locator('button:has-text("Complete")').click()
    ]);
    
    // Get the assigned technician from the API response
    if (completeResponse.ok()) {
      const updatedCaseData = await completeResponse.json();
      const assignedTechId = updatedCaseData.assigned_to?.id || updatedCaseData.data?.assigned_to?.id;
      const assignedTechName = updatedCaseData.assigned_to?.name || updatedCaseData.data?.assigned_to?.name;
      
      if (assignedTechId) {
        // Find technician from our list
        const assignedTech = technicians.find((t: any) => t.id === assignedTechId);
        if (assignedTech && assignedTech.email) {
          technicianId = assignedTech.id;
          technicianEmail = assignedTech.email;
          technicianName = assignedTech.name;
          console.log(`✅ Verified assigned technician from API: ${technicianName} (${technicianEmail}, ID: ${technicianId})`);
        } else {
          console.warn(`⚠️ Assigned technician ID ${assignedTechId} not found in technicians list`);
          console.warn(`   Assigned name from API: "${assignedTechName}"`);
        }
      } else {
        console.warn(`⚠️ Could not get assigned technician ID from API response`);
      }
    } else {
      console.warn(`⚠️ Complete Stage 1 API call failed, using previously selected technician`);
    }
    
    await page.waitForTimeout(2000); // Wait for stage advance
    
    // 6. Verify moved to Stage 2
    const stage2Title = page.locator('.stage-section-title:has-text("Stage 2")');
    await expect(stage2Title).toBeVisible({ timeout: 10000 });
    
    // Logout CS user and login as technician (Stage 2 requires technician permissions)
    // IMPORTANT: Use the technician that was actually assigned (from API response)
    console.log(`🔐 Final login credentials: ${technicianEmail} (${technicianName}, ID: ${technicianId})`);
    // Click logout button
    const logoutButton = page.locator('button.layout-logout-button');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();
    
    // Login as technician
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    await page.fill('input[type="email"]', technicianEmail);
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Navigate back to the case
    await page.goto(`/cases/${caseId}`);
    await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: 10000 });
    
    // Wait for case data API call to complete (ensures permissions are checked)
    await page.waitForResponse(
      (response) => response.url().includes(`/api/cases/${caseId}`) && response.request().method() === 'GET',
      { timeout: 10000 }
    ).catch(() => {
      // API call might have already completed, continue
    });
    
    // Wait for case data to load and user context to be updated
    await page.waitForLoadState('networkidle');
    
    // 7. Complete Stage 2 - Investigation
    const stage2Content = page.locator('.stage-section-content').nth(1);
    const hasStage2Hidden = await stage2Content.evaluate((el) => {
      return el.classList.contains('stage-section-content-hidden');
    });
    
    if (hasStage2Hidden) {
      const stage2Header = page.locator('.stage-section-header').nth(1);
      await stage2Header.click();
      // Wait for the hidden class to be removed AND content to be visible
      await expect(stage2Content).not.toHaveClass('stage-section-content-hidden', { timeout: 5000 });
      await expect(stage2Content).toBeVisible({ timeout: 5000 });
    } else {
      await expect(stage2Content).toBeVisible({ timeout: 5000 });
    }
    
    // Wait for textarea to be visible (only visible when technician has edit permission)
    // This ensures case data has been reloaded and permissions are correct
    // Use a more specific wait: wait for either textarea (editable) or readonly content (not editable)
    const investigationReportTextarea = page.locator('textarea[name="investigation_report"]');
    const readonlyReport = page.locator('.stage2-readonly-content');
    
    // Wait for either editable textarea OR readonly content to appear
    await Promise.race([
      expect(investigationReportTextarea).toBeVisible({ timeout: 15000 }),
      expect(readonlyReport).toBeVisible({ timeout: 15000 })
    ]).catch((error) => {
      throw new Error(`Neither editable textarea nor readonly content appeared. Stage 2 content may not have loaded properly. Error: ${error}`);
    });
    
    // If readonly content is visible, the technician doesn't have edit permission
    // This could happen if the logged-in technician is not the assigned technician
    if (await readonlyReport.isVisible()) {
      const readonlyText = await readonlyReport.textContent();
      throw new Error(`Textarea is readonly. Technician "${technicianName}" (${technicianEmail}) may not be the assigned technician. Readonly content: "${readonlyText}"`);
    }
    
    // Now wait for textarea to be visible and enabled
    await expect(investigationReportTextarea).toBeVisible({ timeout: 5000 });
    await expect(investigationReportTextarea).toBeEnabled({ timeout: 5000 });
    
    await investigationReportTextarea.fill('E2E Test - Investigation completed');
    await page.fill('textarea[name="investigation_checklist"]', '✓ Checked item 1\n✓ Checked item 2');
    
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(2000);
    
    // 8. Verify moved to Stage 3
    const stage3Title = page.locator('.stage-section-title:has-text("Stage 3")');
    await expect(stage3Title).toBeVisible({ timeout: 10000 });
    
    // 9. Complete Stage 3 - Solution & Plan
    const stage3Content = page.locator('.stage-section-content').nth(2);
    const hasStage3Hidden = await stage3Content.evaluate((el) => {
      return el.classList.contains('stage-section-content-hidden');
    });
    
    if (hasStage3Hidden) {
      const stage3Header = page.locator('.stage-section-header').nth(2);
      await stage3Header.click();
      await expect(stage3Content).not.toHaveClass('stage-section-content-hidden', { timeout: 5000 });
    }
    
    await expect(stage3Content).toBeVisible({ timeout: 5000 });
    
    await page.fill('textarea[name="root_cause"]', 'E2E Test - Root cause identified');
    await page.fill('textarea[name="solution_description"]', 'E2E Test - Solution proposed');
    await page.fill('textarea[name="solution_checklist"]', '✓ Solution step 1\n✓ Solution step 2');
    
    // Set planned execution date
    await page.fill('input[type="date"][name="planned_execution_date"]', '2024-12-31');
    
    // Optionally add cost (uncomment if needed)
    // await page.check('input[name="cost_required"]');
    // await page.fill('input[name="estimated_cost"]', '1000');
    // await page.fill('textarea[name="cost_description"]', 'E2E Test - Cost description');
    
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(2000);
    
    // 10. Verify moved to Stage 4
    const stage4Title = page.locator('.stage-section-title:has-text("Stage 4")');
    await expect(stage4Title).toBeVisible({ timeout: 10000 });
    
    // 11. Complete Stage 4 - Execution
    const stage4Content = page.locator('.stage-section-content').nth(3);
    const hasStage4Hidden = await stage4Content.evaluate((el) => {
      return el.classList.contains('stage-section-content-hidden');
    });
    
    if (hasStage4Hidden) {
      const stage4Header = page.locator('.stage-section-header').nth(3);
      await stage4Header.click();
      await expect(stage4Content).not.toHaveClass('stage-section-content-hidden', { timeout: 5000 });
    }
    
    await expect(stage4Content).toBeVisible({ timeout: 5000 });
    
    await page.fill('textarea[name="execution_report"]', 'E2E Test - Execution completed successfully');
    await page.fill('textarea[name="execution_checklist"]', '✓ Execution step 1\n✓ Execution step 2');
    await page.fill('textarea[name="client_signature"]', 'E2E Test - Client Signature');
    await page.fill('textarea[name="client_feedback"]', 'E2E Test - Client feedback');
    
    // Select client rating
    await page.click('text=Select Rating');
    await page.waitForTimeout(500);
    await page.locator('[role="option"]:has-text("5")').click();
    
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(2000);
    
    // 12. Verify moved to Stage 5
    const stage5Title = page.locator('.stage-section-title:has-text("Stage 5")');
    await expect(stage5Title).toBeVisible({ timeout: 10000 });
    
    // 13. Complete Stage 5 - Closing
    const stage5Content = page.locator('.stage-section-content').nth(4);
    const hasStage5Hidden = await stage5Content.evaluate((el) => {
      return el.classList.contains('stage-section-content-hidden');
    });
    
    if (hasStage5Hidden) {
      const stage5Header = page.locator('.stage-section-header').nth(4);
      await stage5Header.click();
      await expect(stage5Content).not.toHaveClass('stage-section-content-hidden', { timeout: 5000 });
    }
    
    await expect(stage5Content).toBeVisible({ timeout: 5000 });
    
    await page.fill('textarea[name="cs_notes"]', 'E2E Test - CS notes');
    await page.fill('textarea[name="final_feedback"]', 'E2E Test - Final feedback');
    
    // Select final rating
    await page.click('text=Select Rating');
    await page.waitForTimeout(500);
    await page.locator('[role="option"]:has-text("5")').click();
    
    // Fill final cost if needed
    // await page.fill('input[name="final_cost"]', '950');
    
    await page.click('button:has-text("Complete")');
    await page.waitForTimeout(2000);
    
    // 14. Verify case completed
    // Check for completion indicators
    await expect(page.locator('text=completed').or(page.locator('text=Completed')).or(page.locator('text=closed'))).toBeVisible({ timeout: 10000 });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test case if needed
    if (caseId && authToken) {
      try {
        await request.delete(`${API_BASE_URL}/api/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error) {
        // Ignore cleanup errors
        console.log('Cleanup failed:', error);
      }
    }
  });
});

