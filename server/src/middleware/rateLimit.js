const rateLimit = require("express-rate-limit");
const { CONFIG } = require("../config");

const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." }
});

module.exports = { limiter };
