// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// === PURE MEMORY STORAGE ===
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

// === REQUEST INTERCEPTOR ===
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===
api.interceptors.response.use(
  (response) => {
    // Simpan token setelah login sukses
    if (
      response.config.method === 'post' &&
      response.config.url?.endsWith('/auth/login') &&
      response.data?.access_token
    ) {
      setAccessToken(response.data.access_token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Jangan retry jika sedang refresh atau login
    if (
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // Coba refresh token saat 401
   if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;

  try {
    const res = await api.post('/auth/refresh-token');
    const newToken = res.data.access_token;
    setAccessToken(newToken); // SIMPAN KE MEMORY
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api(originalRequest); // RETRY
  } catch (refreshError) {
    clearAccessToken();
    // BARU DI SINI REDIRECT
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return Promise.reject(refreshError);
  }
}

    return Promise.reject(error);
  }
);

export default api;