import api from './client';

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (data: { email: string; password: string; name: string; role: string }) =>
  api.post('/auth/register', data);

export const getMe = () => api.get('/auth/me');

