// src/lib/api/playdate.js
import { apiFetch } from "./client";

/**
 * Generate PlayDate activity plans.
 * body: {
 *   ageBand: "3-5" | "6-8" | ...,
 *   durationMins: 30,
 *   budget: "low" | "medium" | "free",
 *   indoorOutdoor: "indoor" | "outdoor"
 * }
 */
export function generatePlaydatePlans(body) {
  return apiFetch("/playdate/plans", { method: "POST", body });
}
