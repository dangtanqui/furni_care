import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TIMEOUTS } from '../constants/test-data';

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await expect(page).toHaveURL(/.*login/);
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/', { timeout: TIMEOUTS.NAVIGATION });
}

export async function logout(page: Page): Promise<void> {
  await page.locator('button.layout-logout-button').click();
  await expect(page).toHaveURL(/.*login/, { timeout: TIMEOUTS.NAVIGATION });
}

export async function selectDropdownOption(page: Page, buttonName: string, optionText?: string): Promise<void> {
  await page.locator(`button[name="${buttonName}"]`).click();
  if (optionText) {
    await page.locator('.select-option').filter({ hasText: optionText }).click();
  } else {
    await page.locator('.select-option').first().click();
  }
}

export async function completeStage(
  page: Page, 
  caseId: number, 
  waitForResponse: boolean = true
): Promise<void> {
  if (waitForResponse) {
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes(`/api/cases/${caseId}`) && 
                     (response.request().method() === 'PATCH' || response.request().method() === 'PUT'),
        { timeout: TIMEOUTS.API_RESPONSE }
      ),
      page.locator('button:has-text("Complete")').click()
    ]);
    
    // Wait for Processing to disappear
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {
      // Processing might not be present, continue
    });
    
    // Wait a bit for UI to update
    await page.waitForTimeout(500);
  } else {
    await page.locator('button:has-text("Complete")').click();
  }
}

export async function fillStageChecklist(page: Page, stageNumber: number, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.locator(`input[id="stage${stageNumber}-checklist-${i}"]`).check();
  }
}

export async function waitForCaseStatus(page: Page, status: string): Promise<void> {
  await expect(
    page.getByRole('status', { name: new RegExp(`Case status: ${status}`, 'i') })
  ).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
}

export async function selectRating(page: Page, stageNumber: number, rating: number): Promise<void> {
  await page.locator(`button.stage${stageNumber}-rating-button:has-text("${rating}")`).click();
}

export async function openStage(page: Page, stageNumber: number): Promise<void> {
  // Find stage section card by stage number
  const stageCard = page.locator('.stage-section-card').filter({ 
    has: page.locator(`.stage-section-title:has-text("Stage ${stageNumber}")`) 
  });
  
  const stageHeader = stageCard.locator('.stage-section-header');
  const stageContent = stageCard.locator('.stage-section-content');
  
  // Wait for stage card to be visible
  await expect(stageCard).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  // Check if stage is already open by checking if content has hidden class
  const hasHiddenClass = await stageContent.evaluate((el) => {
    return el.classList.contains('stage-section-content-hidden');
  });
  
  if (hasHiddenClass) {
    // Click header to open stage
    await stageHeader.click();
    
    // Wait for hidden class to be removed
    await expect(stageContent).not.toHaveClass('stage-section-content-hidden', { timeout: TIMEOUTS.DEFAULT });
    
    // Wait for content to be visible
    await expect(stageContent).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
    
    // Additional wait for content to fully render
    await page.waitForTimeout(300);
  } else {
    // Stage is already open, but ensure content is visible
    await expect(stageContent).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  }
}

export async function waitForCaseDetailLoad(page: Page): Promise<void> {
  // Wait for Loading text to disappear
  const loadingLocator = page.locator('text=Loading...');
  try {
    await expect(loadingLocator).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  } catch {
    // Loading might not be present or already gone, continue
  }
  
  // Wait for case detail content to be visible (case header or stage sections)
  await expect(
    page.locator('.case-header, .stage-section-card, .case-details-page').first()
  ).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
}

export async function gotoCaseDetail(page: Page, caseId: number): Promise<void> {
  await page.goto(`/cases/${caseId}`);
  await expect(page).toHaveURL(/.*cases\/\d+/, { timeout: TIMEOUTS.NAVIGATION });
  await waitForCaseDetailLoad(page);
}

export async function uploadAttachment(
  page: Page,
  stage: number,
  filePath: string
): Promise<void> {
  const fileInput = page.locator(`input[type="file"][id*="stage${stage}-attachments"], input[type="file"][name*="stage${stage}-attachments"]`);
  await expect(fileInput).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/cases') && 
                   response.url().includes('/attachments') &&
                   response.request().method() === 'POST',
      { timeout: TIMEOUTS.API_RESPONSE * 2 }
    ),
    fileInput.setInputFiles(filePath)
  ]);
  
  // Wait for attachment to appear in the grid
  await page.waitForTimeout(1000);
}

export async function deleteAttachment(
  page: Page,
  attachmentId: number
): Promise<void> {
  const deleteButton = page.locator(`button[data-attachment-id="${attachmentId}"], button:has-text("Delete")`).first();
  await expect(deleteButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(`/case_attachments/${attachmentId}`) &&
                   response.request().method() === 'DELETE',
      { timeout: TIMEOUTS.API_RESPONSE }
    ),
    deleteButton.click()
  ]);
  
  await page.waitForTimeout(500);
}

export async function rejectCost(page: Page, caseId: number): Promise<void> {
  const rejectButton = page.locator('button:has-text("Reject")').or(page.locator('button:has-text("reject")'));
  await expect(rejectButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(`/api/cases/${caseId}/reject_cost`) &&
                   response.request().method() === 'POST',
      { timeout: TIMEOUTS.API_RESPONSE }
    ),
    rejectButton.click()
  ]);
  
  await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

export async function rejectFinalCost(page: Page, caseId: number): Promise<void> {
  const rejectButton = page.locator('button:has-text("Reject")').or(page.locator('button:has-text("reject")'));
  await expect(rejectButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(`/api/cases/${caseId}/reject_final_cost`) &&
                   response.request().method() === 'POST',
      { timeout: TIMEOUTS.API_RESPONSE }
    ),
    rejectButton.click()
  ]);
  
  await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

export async function redoCase(page: Page, caseId: number): Promise<void> {
  // Redo button is in Stage 5 with text "Redo → Back to Stage 3"
  await openStage(page, 5);
  const redoButton = page.locator('button:has-text("Redo → Back to Stage 3")').or(page.locator('button:has-text("Redo")'));
  await expect(redoButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(`/api/cases/${caseId}/redo_case`) &&
                   response.request().method() === 'POST',
      { timeout: TIMEOUTS.API_RESPONSE }
    ),
    redoButton.click()
  ]);
  
  await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
  await page.waitForLoadState('networkidle');
  
  // Wait for stage to rollback to Stage 3
  await expect(page.locator('.stage-section-title:has-text("Stage 3")')).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
}

export async function cancelCase(page: Page, caseId: number): Promise<void> {
  // Cancel button is only visible in Stage 3 when cost is rejected
  await openStage(page, 3);
  const cancelButton = page.locator('button:has-text("Cancel")');
  await expect(cancelButton).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
  
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes(`/api/cases/${caseId}/cancel_case`) &&
                   response.request().method() === 'POST',
      { timeout: TIMEOUTS.API_RESPONSE }
    ),
    cancelButton.click()
  ]);
  
  await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: TIMEOUTS.DEFAULT }).catch(() => {});
  await page.waitForLoadState('networkidle');
  
  // Verify case status is cancelled
  await expect(page.getByRole('status', { name: /Case status: Cancelled/i })).toBeVisible({ timeout: TIMEOUTS.DEFAULT });
}

