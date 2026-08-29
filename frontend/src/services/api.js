import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // Clear stale auth data
      localStorage.removeItem('tr_token');
      localStorage.removeItem('tr_user');
      
      // Redirect safely to login and show toast warning (avoid infinite redirect loop)
      if (window.location.pathname !== '/login') {
        toast.error(message || 'Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
