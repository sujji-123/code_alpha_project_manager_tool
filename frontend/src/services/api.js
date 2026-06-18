// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints - Simplified (no OTP)
export const signupUser = (userData) => api.post("/auth/signup", userData);
export const loginUser = (cred) => api.post("/auth/login", cred);
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const resetPassword = (data) => api.post("/auth/reset-password", data);

export default api;