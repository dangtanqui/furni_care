import axios, { type AxiosError } from 'axios';
import { ApiErrorHandler } from '../utils/apiErrorHandler';

// Use VITE_API_URL if provided (for production), otherwise use relative URL (for dev with proxy)
const getBaseURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Ensure it ends with /api
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  // Fallback to relative URL for dev mode (will use Vite proxy)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const appError = ApiErrorHandler.extractError(error);
    const category = ApiErrorHandler.categorizeError(appError);

    if (category === 'authentication') {
      // Unauthorized - token expired or invalid
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Return normalized error
    return Promise.reject(appError);
  }
);

export default api;
