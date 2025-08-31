const path = require("path");
const fs = require("fs");

// Try to load .env.local if it exists
const localEnvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(localEnvPath)) {
  require("dotenv").config({ path: localEnvPath });
}

// Now NODE_ENV should be available if defined in .env.local
const parseCsv = (s) =>
  (s || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),

  DATABASE_URL: process.env.DATABASE_URL || "",

  EVENTBRITE_TOKEN: process.env.EVENTBRITE_TOKEN || "",
  TICKETMASTER_KEY: process.env.TICKETMASTER_KEY || "",
  LIBRARIES_VIC_ENDPOINT: process.env.LIBRARIES_VIC_ENDPOINT || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
};

module.exports = { CONFIG };
