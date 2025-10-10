// config for environment variables and app settings

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

//  .env from root if present during local and from env vars manager in production
const localEnvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

// parse comma separated values from environment variables
const parseCsv = (s) =>
  (s || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

// export all config values in one place
const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || "development", // node environment
  API_ENV: process.env.API_ENV || "local", // api environment

  PORT: parseInt(process.env.PORT || "5000", 10), // server port

  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS), // allowed cors origins

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // rate limit window
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "60", 10), // max requests per window

  DATABASE_URL: process.env.DATABASE_URL || "", // database connection string
  PG_POOL_MAX: parseInt(process.env.PG_POOL_MAX || "0", 10), // max database pool connections

  TICKETMASTER_KEY: process.env.TICKETMASTER_KEY || "", // ticketmaster api key
  
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",

  // gemini 4-tier model strategy
  GEMINI_PRO_MODEL: process.env.GEMINI_PRO_MODEL || "models/gemini-2.5-pro", // tier 1 premium
  GEMINI_STANDARD_MODEL: process.env.GEMINI_STANDARD_MODEL || "models/gemini-2.5-flash", // tier 1 standard
  GEMINI_PRO_FALLBACK: process.env.GEMINI_PRO_FALLBACK || "models/gemini-2.5-flash-lite", // tier 2 premium fallback
  GEMINI_STANDARD_FALLBACK: process.env.GEMINI_STANDARD_FALLBACK || "models/gemini-2.0-flash", // tier 2 standard fallback

  // configurable model sequences for reliable generation 
  GENERATE_MODEL_SEQUENCE: process.env.GENERATE_MODEL_SEQUENCE || "FLASH,FLASH,PRO", // generation priority
  VALIDATE_MODEL_SEQUENCE: process.env.VALIDATE_MODEL_SEQUENCE || "LITE,FLASH", // validation priority

  // multi-key pool 
  GEMINI_API_KEYS: [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
  ].filter(Boolean), // remove undefined keys
  
  EVENTFINDA_USERNAME: process.env.EVENTFINDA_USERNAME || "", // eventfinda username
  EVENTFINDA_PASSWORD: process.env.EVENTFINDA_PASSWORD || "", // eventfinda password
  EVENTFINDA_BASE: process.env.EVENTFINDA_BASE || "https://api.eventfinda.com.au/v2", // eventfinda base url
};

// export config object
module.exports = { CONFIG };