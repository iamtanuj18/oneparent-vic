// import config and helpers
const { CONFIG } = require("../config");
const { resolveLocation } = require("../utils/locationResolver");
const CATEGORY_MAP = require("../utils/categoryMapping");

// default image if event has no image
const DEFAULT_IMAGE_URL = "https://www.ausleisure.com.au/images/ausleisure/files/Eventfinda_lr.jpg";

// cache for location and category ids
const _cache = {
  locationId: new Map(),
  categoryId: new Map(),
};

// trim description and remove html tags
function trimDescription(description, maxLength = 120) {
  if (!description) return "";
  
  // strip html tags
  const plainText = description.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) return plainText;
  
  // trim to last complete word within limit
  const trimmed = plainText.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  
  return lastSpace > 0 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...';
}

// check if event date is within filter range
function isEventInDateRange(eventStartDate, filterDateFrom, filterDateTo) {
  if (!eventStartDate) return false;
  
  const eventDate = new Date(eventStartDate);
  const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
  const toDate = filterDateTo ? new Date(filterDateTo) : null;
  
  if (fromDate && eventDate < fromDate) {
    return false;
  }
  
  if (toDate && eventDate > toDate) {
    return false;
  }
  
  return true;
}

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

// build url parameters for api call
const toQS = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

// get keywords for category from category map
function getCategoryKeywords(category) {
  if (!category) return []; // return empty if no category
  const catCfg = CATEGORY_MAP?.[category]?.eventfinda;
  return Array.isArray(catCfg?.keywords) ? catCfg.keywords : [];
}

// build location query using location resolver
function buildLocationQuery() {
  const locationConfig = resolveLocation("eventfinda");
  if (locationConfig.city && locationConfig.region && locationConfig.country) {
    return `${locationConfig.city} ${locationConfig.region} ${locationConfig.country}`;
  }
  return "Victoria Australia";
}

// get best image from eventfinda response
function extractEventImage(eventData) {
  if (!eventData.images || !eventData.images.images || !Array.isArray(eventData.images.images)) {
    return null;
  }

  let primaryImage = eventData.images.images.find(img => img.is_primary === true);
  
  if (!primaryImage && eventData.images.images.length > 0) {
    primaryImage = eventData.images.images[0];
  }

  if (!primaryImage) {
    return null;
  }

  if (primaryImage.transforms && primaryImage.transforms.transforms && Array.isArray(primaryImage.transforms.transforms)) {
    const transforms = primaryImage.transforms.transforms;
    
    const transform7 = transforms.find(t => t.transformation_id === 7);
    if (transform7 && transform7.url) {
      return transform7.url;
    }

    const transform27 = transforms.find(t => t.transformation_id === 27);
    if (transform27 && transform27.url) {
      return transform27.url;
    }

    const transform8 = transforms.find(t => t.transformation_id === 8);
    if (transform8 && transform8.url) {
      return transform8.url;
    }

    const anyTransform = transforms.find(t => t.url);
    if (anyTransform && anyTransform.url) {
      return anyTransform.url;
    }
  }

  if (primaryImage.original_url) {
    return primaryImage.original_url;
  }

  return null;
}

// call eventfinda api with authentication
async function callEventfinda(pathAndQuery) {
  const { EVENTFINDA_BASE, EVENTFINDA_USERNAME, EVENTFINDA_PASSWORD } = CONFIG;
  const url = `${EVENTFINDA_BASE}${pathAndQuery.startsWith("/") ? "" : "/"}${pathAndQuery}`;
  const auth = "Basic " + Buffer.from(`${EVENTFINDA_USERNAME}:${EVENTFINDA_PASSWORD}`).toString("base64");

  try {
    const res = await fetch(url, { 
      method: "GET", 
      headers: { 
        Authorization: auth, 
        Accept: "application/json" 
      } 
    });

    if (!res.ok) {
      console.error(`[Eventfinda] api error: ${res.status}`);
      throw new Error(`HTTP ${res.status} from Eventfinda`);
    }

    const bodyText = await res.text();
    return JSON.parse(bodyText);
  } catch (err) {
    console.error("eventfinda fetch failed:", err.message);
    throw err;
  }
}

// get location id by searching location name
async function resolveLocationId(locationQuery) {
  if (_cache.locationId.has(locationQuery)) {
    return _cache.locationId.get(locationQuery);
  }

  const qs = toQS({
    rows: 1,
    q: locationQuery,
    fields: "id,name",
  });

  try {
    const data = await callEventfinda(`/locations.json?${qs}`);
    const locations = Array.isArray(data?.locations) ? data.locations : [];
    const id = locations[0]?.id || null;
    
    console.log(`[Eventfinda] location "${locationQuery}" found id: ${id}`);
    _cache.locationId.set(locationQuery, id);
    return id;
  } catch (e) {
    console.warn(`[Eventfinda] location search failed: ${e.message}`);
    _cache.locationId.set(locationQuery, null);
    return null;
  }
}

// get category id by searching keywords
async function resolveCategoryId(keywords) {
  if (!keywords || keywords.length === 0) return null;
  
  const cacheKey = keywords.join(",");
  if (_cache.categoryId.has(cacheKey)) {
    return _cache.categoryId.get(cacheKey);
  }

  const qs = toQS({
    rows: 1,
    q: keywords.join(" "),
    fields: "id,name",
  });

  try {
    const data = await callEventfinda(`/categories.json?${qs}`);
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const id = categories[0]?.id || null;
    
    console.log(`[Eventfinda] category [${keywords.join(", ")}] found id: ${id}`);
    _cache.categoryId.set(cacheKey, id);
    return id;
  } catch (e) {
    console.warn(`[Eventfinda] category search failed: ${e.message}`);
    _cache.categoryId.set(cacheKey, null);
    return null;
  }
}

// get events from eventfinda using filters
async function getEventfindaEvents(filters = {}) {
  const {
    category, // will be null for load more calls
    dateFrom,
    dateTo,
    page = 0,
    perPage = 6,
  } = filters;

  const { EVENTFINDA_USERNAME, EVENTFINDA_PASSWORD } = CONFIG;
  if (!EVENTFINDA_USERNAME || !EVENTFINDA_PASSWORD) {
    throw new Error("missing eventfinda credentials");
  }

  // only get keywords for initial search, not pagination
  const keywords = getCategoryKeywords(category);
  console.log(`[Eventfinda] page=${page} category="${category || 'none'}" keywords=[${keywords.join(", ")}]`);

  // find location and category ids
  const locationQuery = buildLocationQuery();
  const locationId = await resolveLocationId(locationQuery);
  const categoryId = keywords.length > 0 ? await resolveCategoryId(keywords) : null;

  // build api parameters with stable sorting
  const params = {
    rows: perPage,
    offset: page * perPage,
    date_from: dateFrom,
    date_to: dateTo,
    fields: "id,name,url,datetime_start,location_summary,address,images,description",
    order: "datetime_start,id", // stable sorting
  };

  if (locationId) {
    params.location = String(locationId);
  }

  // only set category filter for initial search
  if (categoryId) {
    params.category = String(categoryId);
  }

  const searchKeywords = [
    !locationId ? locationQuery : null,
    ...keywords
  ].filter(Boolean);

  // only add keyword search for initial search
  if (searchKeywords.length > 0) {
    params.q = searchKeywords.join(" ");
  }

  const qs = toQS(params);
  console.log(`[Eventfinda] calling api with: ${qs}`);

  try {
    const data = await callEventfinda(`/events.json?${qs}`);

    const raw = Array.isArray(data?.events) ? data.events : [];
    
    const events = raw
      .filter(e => isEventInDateRange(e.datetime_start, dateFrom, dateTo))
      .map((e) => {
        const eventfindaImage = extractEventImage(e);

        return {
          id: e.id,
          title: e.name || "untitled event",
          date: e.datetime_start,
          rawDate: e.datetime_start,
          location: e.location_summary || e.address || "Victoria, Australia",
          description: trimDescription(e.description),
          url: e.url || "#",
          image: eventfindaImage || DEFAULT_IMAGE_URL,
          category: category || "other",
          source: "Eventfinda",
        };
      });

    console.log(`[Eventfinda] found ${events.length} events within date range`);
    return events;

  } catch (err) {
    console.error("eventfinda fetch failed:", err.message);
    return [];
  }
}

// export the eventfinda events function
module.exports = { getEventfindaEvents };
