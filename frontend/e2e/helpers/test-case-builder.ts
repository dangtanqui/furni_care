import type { Page } from '@playwright/test';
import { selectDropdownOption } from './case-workflow-helpers';
import { TEST_DATA, TIMEOUTS } from '../constants/test-data';

export interface CreateCaseOptions {
  caseType?: 'Repair' | 'Maintenance' | 'Warranty';
  priority?: 'Low' | 'Medium' | 'High';
  description?: string;
}

export class TestCaseBuilder {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }

  async createCase(options: CreateCaseOptions = {}): Promise<number> {
    const {
      caseType = 'Repair',
      priority = 'Medium',
      description = TEST_DATA.DESCRIPTION
    } = options;

    await this.page.getByRole('link', { name: 'Create Case' }).click();
    await selectDropdownOption(this.page, 'client_id');
    await selectDropdownOption(this.page, 'site_id');
    await selectDropdownOption(this.page, 'contact_id');
    await this.page.fill('textarea[name="description"]', description);
    await selectDropdownOption(this.page, 'case_type', caseType);
    await selectDropdownOption(this.page, 'priority', priority);
    
    const submitButton = this.page.locator('button[type="submit"]:has-text("Submit")');
    const [createResponse] = await Promise.all([
      this.page.waitForResponse(resp => 
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
    return caseData.id;
  }

  async assignTechnician(caseId: number, technicianName: string): Promise<void> {
    await this.page.goto(`/cases/${caseId}`);
    await this.page.locator('button[name="assigned_to"]').click();
    await this.page.locator('.select-option').filter({ hasText: technicianName }).click();
  }

  async progressToStage(caseId: number): Promise<void> {
    // This is a helper to progress case to a specific stage
    // Implementation depends on current stage
    // For now, this is a placeholder - can be expanded based on needs
    await this.page.goto(`/cases/${caseId}`);
    // Add stage progression logic here
  }
}

