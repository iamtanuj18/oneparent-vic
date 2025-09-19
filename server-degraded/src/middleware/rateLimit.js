// use express rate limit to control requests
const rateLimit = require("express-rate-limit");
const { CONFIG } = require("../config");

// set up the limiter with config values
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests. please slow down." }
});

// export the limiter for use in routes
module.exports = { limiter };
