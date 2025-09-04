// import location resolver and category map
const { resolveLocation } = require("../utils/locationResolver");
const CATEGORY_MAP = require("../utils/categoryMapping");

// format date to australian style
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

// trim description and remove html tags
function trimDescription(description, maxLength = 120) {
  if (!description) return "";
  
  // strip html tags if any
  const plainText = description.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) return plainText;
  
  // trim to last complete word within limit
  const trimmed = plainText.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  
  return lastSpace > 0 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...';
}

// convert date to ticketmaster iso format
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

// get events from ticketmaster using filters
async function getTicketmasterEvents(filters = {}) {
  const {
    category, // will be null for load more calls
    dateFrom,
    dateTo,
    page = 0,
    perPage = 6,
  } = filters;

  const API_KEY = process.env.TICKETMASTER_KEY;
  const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

  // only get keywords for initial search, not pagination
  const catCfg = category ? CATEGORY_MAP?.[category]?.ticketmaster : null;
  const keywords = Array.isArray(catCfg?.keywords) ? catCfg.keywords : [];

  const locationConfig = resolveLocation("ticketmaster");

  const params = new URLSearchParams({
    apikey: API_KEY,
    size: String(perPage),
    page: String(page),
    sort: "date,asc", // stable sorting
    ...locationConfig,
  });

  // only add keywords for initial search
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
  console.log(`[Ticketmaster] page=${page} vic-only kw=[${keywords.join(", ")}]`);

  try {
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`ticketmaster api error: ${res.status}`);
    const data = await res.json();

    const events = data?._embedded?.events || [];
    return events.map((e) => {
      const venue = e._embedded?.venues?.[0];
      return {
        id: e.id,
        title: e.name,
        date: formatToAustralianDate(e.dates?.start?.localDate),
        rawDate: e.dates?.start?.dateTime || e.dates?.start?.localDate,
        location: `${venue?.name || "N/A"}, ${venue?.city?.name || "N/A"}`,
        description: trimDescription(e.info || e.pleaseNote),
        url: e.url,
        image: e.images?.[0]?.url || null,
        category: category || "other",
        source: "Ticketmaster",
      };
    });
  } catch (err) {
    console.error("ticketmaster fetch failed:", err.message);
    return [];
  }
}

// export the ticketmaster events function
module.exports = { getTicketmasterEvents };
