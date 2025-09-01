// src/config.js

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load .env.local from root directory if it exists
const localEnvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

/**
 * Parses comma-separated values  CORS_ORIGINS
 */
const parseCsv = (s) =>
  (s || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

/**
 * Export all config values in one place
 */
const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || "development",
  API_ENV: process.env.API_ENV || "local",

  PORT: parseInt(process.env.PORT || "5000", 10),

  // CORS
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),

  // Rate limiter
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "60", 10),

  // Database 
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Third-party API keys 
  TICKETMASTER_KEY: process.env.TICKETMASTER_KEY || "",
  EVENTBRITE_TOKEN: process.env.EVENTBRITE_TOKEN || "",
  HUMANITIX_TOKEN: process.env.HUMANITIX_TOKEN || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
};

module.exports = { CONFIG };