// src/lib/api/childcare.js
import { apiFetch } from "./client";

/**
 * Calculate childcare/kinder weekly net cost.
 */
export function calculateChildcare(body) {
  return apiFetch("/childcare/calc", { method: "POST", body });
}
