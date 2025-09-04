import { apiFetch } from "./client";

/**
 * PLaydate generate api call. 
 */
export function generatePlaydatePlans(body) {
  return apiFetch("/playdate-generate", { method: "POST", body });
}

/**
 * Gemini-backed safety validation for the full wizard payload.
 */
export function validatePlaydateInput(payload) {
  return apiFetch("/playdate-safety-checks", { method: "POST", body: payload });
}

/**
 * suburb list api
 */
export function fetchSuburbList(query) {
  return apiFetch(`/suburb-list?q=${encodeURIComponent(query)}`, { method: "GET" });
}
