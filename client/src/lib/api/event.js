// src/lib/api/event.js

import { apiFetch } from "./client";

export function getEvents(body = {}) {
  return apiFetch("/get-events", { method: "POST", body });
}
