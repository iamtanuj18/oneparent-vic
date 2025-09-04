// src/lib/api/benefits.js
import { apiFetch } from "./client";

/**
 * benefits & entitlements.
 */
export function matchBenefits(body) {
  return apiFetch("/benefits/match", { method: "POST", body });
}

