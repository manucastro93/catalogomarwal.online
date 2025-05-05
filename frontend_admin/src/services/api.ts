import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (!backendUrl) {
  throw new Error('VITE_BACKEND_URL no está definido en el .env');
}

const api = axios.create({
  baseURL: backendUrl + '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
