import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export const UPLOADS_URL = BASE.replace('/api', '/uploads');

const api = axios.create({ baseURL: BASE, timeout: 60000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mj_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mj_token');
      localStorage.removeItem('mj_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
