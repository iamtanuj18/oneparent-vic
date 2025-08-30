// src/lib/api/event.js
import { apiFetch } from "./client";

/**
 * Search events across multiple providers.
 * body: {
 *   city?: "Melbourne",
 *   freeOnly?: true,
 *   weekend?: true,
 *   ageRange?: "5-8",
 *   categories?: ["library","outdoors"],
 *   limit?: 20
 * }
 */
export function searchEvents(body = {}) {
  return apiFetch("/events/search", { method: "POST", body });
}

/**
 * Get event details. Using POST so backend can route to a provider.
 * body: { provider: "eventbrite" | "ticketmaster" , id: "abc123" }
 */
export function fetchEventDetails(body) {
  return apiFetch("/events/details", { method: "POST", body });
}
