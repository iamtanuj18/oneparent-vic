// config for environment variables and app settings

// import modules for env loading
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// load .env.local from root if present
const localEnvPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

// parse comma separated values
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

  TICKETMASTER_KEY: process.env.TICKETMASTER_KEY || "", // ticketmaster api key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "", // gemini api key
  EVENTFINDA_USERNAME: process.env.EVENTFINDA_USERNAME || "", // eventfinda username
  EVENTFINDA_PASSWORD: process.env.EVENTFINDA_PASSWORD || "", // eventfinda password
  EVENTFINDA_BASE: process.env.EVENTFINDA_BASE || "https://api.eventfinda.com.au/v2", // eventfinda base url

};

// export config object
module.exports = { CONFIG };