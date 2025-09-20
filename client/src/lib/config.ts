// API configuration and base URL management
export const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  API_BASE: (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") || "/api/community-match",
  DATA_BASE: (import.meta as any).env?.VITE_DATA_BASE?.replace(/\/$/, "") || "/data"
};
