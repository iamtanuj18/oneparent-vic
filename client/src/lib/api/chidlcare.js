// src/lib/api/childcare.js
import { apiFetch } from "./client";

/**
 *  childcare cost.
 */
export function calculateChildcare(body) {
  return apiFetch("/childcare/calc", { method: "POST", body });
}
