const { resolveLocation } = require("../utils/locationResolver");
const CATEGORY_MAP = require("../utils/categoryMapping");

/** Format to DD/MM/YYYY safely */
function formatToAustralianDate(isoDate) {
  if (!isoDate) return "N/A";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/** ISO 8601 UTC Z at start/end of day */
function toTicketmasterDate(dateStr, endOfDay = false) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    if (endOfDay) d.setUTCHours(23, 59, 59, 0);
    else d.setUTCHours(0, 0, 0, 0);
    return d.toISOString().replace(/\.\d{3}Z$/, "Z");
  } catch {
    return null;
  }
}

/**
 * Ticketmaster fetch:
 * - ALWAYS uses AU/VIC from resolver.
 * - Uses CATEGORY_MAP.ticketmaster.keywords only.
 */
async function getTicketmasterEvents(filters = {}) {
  const {
    category,
    dateFrom,
    dateTo,
    page = 0,
    perPage = 6, // 🔹 match /get-events default
  } = filters;

  const API_KEY = process.env.TICKETMASTER_KEY;
  const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

  const catCfg = CATEGORY_MAP?.[category]?.ticketmaster;
  const keywords = Array.isArray(catCfg?.keywords) ? catCfg.keywords : [];

  // 🔒 Always { countryCode:'AU', stateCode:'VIC' }
  const locationConfig = resolveLocation("ticketmaster");

  const params = new URLSearchParams({
    apikey: API_KEY,
    size: String(perPage),
    page: String(page),
    ...locationConfig,
  });

  if (keywords.length > 0) {
    params.append("keyword", keywords.join(" "));
  }

  if (dateFrom) {
    const from = toTicketmasterDate(dateFrom, false);
    if (from) params.append("startDateTime", from);
  }
  if (dateTo) {
    const to = toTicketmasterDate(dateTo, true);
    if (to) params.append("endDateTime", to);
  }

  const finalUrl = `${BASE_URL}?${params.toString()}`;
  console.log(`[Ticketmaster] page=${page} VIC-only kw=[${keywords.join(", ")}] → ${finalUrl}`);

  try {
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`Ticketmaster API error: ${res.status}`);
    const data = await res.json();

    const events = data?._embedded?.events || [];
    return events.map((e) => {
      const venue = e._embedded?.venues?.[0];
      return {
        title: e.name,
        date: formatToAustralianDate(e.dates?.start?.localDate),
        location: `${venue?.name || "N/A"}, ${venue?.city?.name || "N/A"}`,
        url: e.url,
        image: e.images?.[0]?.url || null,
        category: category || "Other",
        source: "Ticketmaster",
      };
    });
  } catch (err) {
    console.error("Ticketmaster fetch failed:", err.message);
    return [];
  }
}

module.exports = { getTicketmasterEvents };
