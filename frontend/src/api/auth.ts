import api from './client';

export const login = (email: string, password: string, rememberMe: boolean = false) =>
  api.post('/auth/login', { email, password, remember_me: rememberMe });

export const register = (data: { email: string; password: string; name: string; role: string }) =>
  api.post('/auth/register', data);

export const getMe = () => api.get('/auth/me');

