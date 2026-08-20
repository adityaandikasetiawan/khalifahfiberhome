import axios from "axios";

// Instance terpisah dari lib/api.ts (dipakai admin) -- portal pelanggan punya
// token JWT dengan tipe berbeda ("customer"), disimpan dengan key localStorage
// terpisah supaya sesi admin & pelanggan tidak saling menimpa di browser yang sama.
export const portalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
});

portalApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("portalAccessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err?.response?.status === 401) {
      localStorage.removeItem("portalAccessToken");
      window.location.href = "/portal/login";
    }
    return Promise.reject(err);
  },
);
