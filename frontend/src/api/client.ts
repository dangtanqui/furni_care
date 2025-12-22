import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  (error) => {
    if (error.response) {
      // Handle HTTP error responses
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Forbidden - user doesn't have permission
        // Don't redirect, let the component handle the error
        return Promise.reject(error);
      }
    } else if (error.request) {
      // Network error - request was made but no response received
      // Return a user-friendly error
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    return Promise.reject(error);
  }
);

export default api;

