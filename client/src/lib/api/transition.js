// src/lib/api/transition.js
import { apiFetch } from "./client";

/**
 * 5-year journey summary + next steps.
 */
export function fetchTransitionSummary(body) {
  return apiFetch("/transition/summary", { method: "POST", body });
}
