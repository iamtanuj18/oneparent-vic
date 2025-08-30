// src/lib/api/insights.js
import { apiFetch } from "./client";

/** 
 * body: {User selected options or none}
 */
export function fetchInsightsOverview(body = {}) {
  return apiFetch("/insights/overview", { method: "POST", body });
}

/**
 */
export function fetchInsightsTrends(body = {}) {
  return apiFetch("/insights/trends", { method: "POST", body });
}
