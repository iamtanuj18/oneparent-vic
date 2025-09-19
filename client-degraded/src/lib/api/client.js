// src/lib/api/client.js
import { CONFIG } from "../config";

const BASE_URL = CONFIG.API_BASE_URL;

// Thin wrapper around fetch with JSON body / query and basic error surfacing
export async function apiFetch(
  endpoint,
  { method = "POST", body, params, responseType = "json" } = {}
) {
  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  // Only set JSON header when sending a JSON body
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Helper to throw with body-aware message + status
  const throwWithMessage = async () => {
    let msg = `API ${res.status}`;
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        const data = await res.json();
        msg = data?.error || data?.message || msg;
      } else {
        const text = await res.text();
        msg = text || msg;
      }
    } catch(_e) {
      // Ignore JSON parsing errors
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;     
  }; 

  if (!res.ok) {
    await throwWithMessage();
  }

  // Return type handling
  if (responseType === "blob") {
    const ct = res.headers.get("content-type") || "";
    const blob = await res.blob();

    // If the server sent JSON/text (likely an error), surface it as an error
    if (!ct.includes("application/pdf")) {
      try {
        const text = await blob.text();
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.message || text;
        } catch(_e) {
          // Ignore JSON parsing errors
        }
        const err = new Error(msg || "PDF export failed");
        err.status = res.status;
        throw err;
      } catch {
        const err = new Error("PDF export failed");
        err.status = res.status;
        throw err;
      }
    }
    return blob;
  }

  if (responseType === "text") return res.text();
  // default
  return res.json();
}

// Health GET
export function getHealth() {
  return apiFetch("/health", { method: "GET" });
}
