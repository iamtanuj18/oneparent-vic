// src/lib/api/wellbeing.js
import { apiFetch } from "./client";

/**
 * Quick self-check + tailored supports.
 */
export function runWellbeingCheck(body) {
  return apiFetch("/wellbeing/check", { method: "POST", body });
}