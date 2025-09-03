// separate api functions for each provider
import { apiFetch } from "./client";

// call ticketmaster events api
export function getTicketmasterEvents(body = {}) {
  return apiFetch("/ticketmaster", { method: "POST", body });
}

// call eventfinda events api
export function getEventfindaEvents(body = {}) {
  return apiFetch("/eventfinda", { method: "POST", body });
}
