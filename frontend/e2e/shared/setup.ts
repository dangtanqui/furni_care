import type { APIRequestContext, Page } from '@playwright/test';
import { TEST_USERS } from '../constants/test-data';

export interface TestSetupData {
  authToken: string;
  clientId: number;
  siteId: number;
  technicianEmail: string;
  technicianName: string;
  leaderEmail: string;
  technicians: Array<{ id: number; name: string; email: string }>;
}

export async function setupTestData(request: APIRequestContext, apiBaseUrl: string): Promise<TestSetupData> {
  if (!apiBaseUrl) {
    throw new Error('VITE_API_URL must be set in .env file');
  }

  // Login as CS
  const loginResponse = await request.post(`${apiBaseUrl}/api/auth/login`, {
    data: {
      email: TEST_USERS.CS,
      password: TEST_USERS.PASSWORD
    }
  });

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }

  const loginData = await loginResponse.json();
  const authToken = loginData.token;

  // Get clients
  const clientsResponse = await request.get(`${apiBaseUrl}/api/clients`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!clientsResponse.ok()) {
    throw new Error(`Failed to fetch clients: ${clientsResponse.status()}`);
  }

  const clients = await clientsResponse.json();
  if (!clients || clients.length === 0) {
    throw new Error('No clients found in test database');
  }
  const clientId = clients[0].id;
  
  // Get sites
  const sitesResponse = await request.get(`${apiBaseUrl}/api/clients/${clientId}/sites`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!sitesResponse.ok()) {
    throw new Error(`Failed to fetch sites: ${sitesResponse.status()}`);
  }

  const sites = await sitesResponse.json();
  if (!sites || sites.length === 0) {
    throw new Error('No sites found in test database');
  }
  const siteId = sites[0].id;

  // Get contacts
  const contactsResponse = await request.get(`${apiBaseUrl}/api/sites/${siteId}/contacts`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!contactsResponse.ok()) {
    throw new Error(`Failed to fetch contacts: ${contactsResponse.status()}`);
  }

  // Get technicians
  const techniciansResponse = await request.get(`${apiBaseUrl}/api/users/technicians`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (!techniciansResponse.ok()) {
    throw new Error(`Failed to fetch technicians: ${techniciansResponse.status()}`);
  }

  const technicians = await techniciansResponse.json();
  if (!technicians || technicians.length === 0) {
    throw new Error('No technicians found in test database');
  }
  
  const selectedTech = technicians[0];
  const technicianEmail = selectedTech.email;
  const technicianName = selectedTech.name;

  // Get leader email
  const leaderEmail = 'leader@demo.com';

  return {
    authToken,
    clientId,
    siteId,
    technicianEmail,
    technicianName,
    leaderEmail,
    technicians
  };
}

export async function cleanupCase(
  request: APIRequestContext,
  apiBaseUrl: string,
  caseId: number,
  authToken: string
): Promise<void> {
  try {
    await request.delete(`${apiBaseUrl}/api/cases/${caseId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  } catch (error) {
    // Log but don't fail
    console.error(`Failed to cleanup case ${caseId}:`, error);
  }
}

