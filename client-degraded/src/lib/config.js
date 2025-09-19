// src/lib/config.js
export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  ENV: import.meta.env.VITE_ENV || "local",
};
