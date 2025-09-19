import { apiFetch } from "./client";

export function fetchHeroStats(body = {}) {
  return apiFetch("/hero", { method: "POST", body });
}

export function fetchInsightsOverview(body = {}) {
  return apiFetch("/overview", { method: "POST", body });
}

export function fetchInsightsTrends(body = {}) {
  return apiFetch("/trends", { method: "POST", body });
}

export function fetchInsightsLabourBars(state = "VIC", year) {
  return apiFetch("/labour-bars", { method: "POST", body: { state, year } });
}

export function fetchPpsLatest(state = "VIC") {
  return apiFetch("/pps/latest", { method: "POST", body: { state } });
}

export function fetchPpsTrends(state = "VIC", metric = "state_total") {
  return apiFetch("/pps/trends", { method: "POST", body: { state, metric } });
}
