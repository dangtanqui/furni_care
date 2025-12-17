import api from './client';

export interface Client {
  id: number;
  name: string;
  code: string;
}

export interface Site {
  id: number;
  name: string;
  city: string;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export const getClients = () => api.get<Client[]>('/clients');
export const getSites = (clientId: number) => api.get<Site[]>(`/clients/${clientId}/sites`);
export const getContacts = (siteId: number) => api.get<Contact[]>(`/sites/${siteId}/contacts`);
export const getTechnicians = () => api.get<{ id: number; name: string }[]>('/users/technicians');

