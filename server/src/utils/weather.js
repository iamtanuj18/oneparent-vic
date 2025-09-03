//src/utils/weather.js

const { fetch } = require("undici");

const MELBOURNE_TZ = "Australia/Melbourne";
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

// simple map of weather codes
const WMO = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "light snow",
  73: "moderate snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
  96: "thunderstorm w/ hail",
  99: "severe thunderstorm"
};

// helper to bias search to victoria, australia
function addVicBias(place) {
  var s = String(place || "").trim();
  if (!s) return "";
  if (/\b(victoria|vic|australia)\b/i.test(s)) return s;
  return s + ", Victoria, Australia";
}

// use nominatim (osm) to turn place name into lat/lon
async function geocodeNominatim(placeRaw) {
  var place = addVicBias(placeRaw);
  var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=" + encodeURIComponent(place);

  console.log("[weather] geocode url:", url);

  var res = await fetch(url, {
    headers: {
      "User-Agent": "oneparent-vic/1.0 (contact: you@example.com)"
    }
  });
  if (!res.ok) throw new Error("geocode failed " + res.status);

  var data = await res.json();
  console.log("[weather] geocode raw result:", JSON.stringify(data, null, 2));

  if (!Array.isArray(data) || data.length === 0) throw new Error("no geocode result");

  var best = data.find(function(r) {
    return /victoria/i.test(r.display_name) && /australia/i.test(r.display_name);
  }) || data[0];

  console.log("[weather] geocode chosen:", best.display_name, best.lat, best.lon);

  return {
    name: best.display_name,
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon)
  };
}

// fetch weather from open-meteo using lat/lon and a date (yyyy-mm-dd)
async function fetchForecast(coords, date) {
  var url = OPEN_METEO
    + "?latitude=" + coords.lat
    + "&longitude=" + coords.lon
    + "&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m"
    + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
    + "&timezone=" + encodeURIComponent(MELBOURNE_TZ)
    + "&windspeed_unit=kmh"
    + "&start_date=" + date
    + "&end_date=" + date;

  console.log("[weather] forecast url:", url);

  var res = await fetch(url);
  if (!res.ok) throw new Error("forecast failed " + res.status);
  var data = await res.json();

  console.log("[weather] forecast raw result (truncated):", {
    hourlyTimes: data.hourly && data.hourly.time ? data.hourly.time.slice(0, 3) : [],
    daily: data.daily
  });

  return data;
}

// main exported function: build weather context
async function getWeatherContext(place, date, timeOpt) {
  var g = await geocodeNominatim(place);
  var fc = await fetchForecast(g, date);

  // pick forecast hour: prefer given timeOpt, else 12:00, else fallback
  var times = fc.hourly.time || [];
  var i = -1;

  if (timeOpt && /^\d{2}:\d{2}$/.test(timeOpt)) {
    var targetHour = parseInt(timeOpt.split(":")[0], 10);
    var bestDiff = 99;
    var bestIdx = 0;
    for (var j = 0; j < times.length; j++) {
      var h = parseInt(times[j].slice(-5, -3), 10) || 0;
      var diff = Math.abs(h - targetHour);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = j;
      }
    }
    i = bestIdx;
  }

  if (i < 0) {
    i = times.findIndex(function(t) { return t.endsWith("12:00"); });
  }
  if (i < 0 && times.length > 0) i = 0;

  var hour = {
    timeISO: fc.hourly.time[i],
    tempC: fc.hourly.temperature_2m[i],
    precipProb: fc.hourly.precipitation_probability[i] || 0,
    code: fc.hourly.weathercode[i],
    weatherText: WMO[fc.hourly.weathercode[i]] || "weather",
    windKph: fc.hourly.windspeed_10m[i]
  };

  var day = {
    tMax: fc.daily.temperature_2m_max[0],
    tMin: fc.daily.temperature_2m_min[0],
    precipSum: fc.daily.precipitation_sum[0]
  };

  var labelParts = [];
  labelParts.push(date);
  if (Number.isFinite(hour.tempC)) labelParts.push(Math.round(hour.tempC) + "°C");
  labelParts.push(hour.weatherText);
  labelParts.push(hour.precipProb + "% rain");
  if (hour.windKph != null) labelParts.push("wind " + hour.windKph + " km/h");

  var contextString = labelParts.join(" · ");

  var finalPayload = { place: g, hour: hour, day: day, contextString: contextString };
  console.log("[weather] final context:", JSON.stringify(finalPayload, null, 2));

  return finalPayload;
}

module.exports = {
  getWeatherContext
};
