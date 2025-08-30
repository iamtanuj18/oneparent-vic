// src/lib/api/client.js
import { CONFIG } from "../config";

const BASE_URL = CONFIG.API_BASE_URL;

// Thin wrapper around fetch with JSON body / query and basic error surfacing
export async function apiFetch(endpoint, { method = "POST", body, params } = {}) {
  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch {
      msg = (await res.text()) || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}

// Health GET
export function getHealth() {
  return apiFetch("/health", { method: "GET" });
}
