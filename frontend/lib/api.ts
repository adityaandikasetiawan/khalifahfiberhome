import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
});

// Sisipkan JWT access token ke setiap request (disimpan di localStorage setelah login)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expired / unauthorized: bersihkan token & arahkan ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const path = window.location.pathname;
      // Jangan redirect kalau memang sedang di halaman login (hindari loop)
      if (path !== "/login") {
        localStorage.removeItem("accessToken");
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  },
);
