const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { CONFIG } = require("../config");

// general rate limiter for all endpoints
const generalLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests. please slow down." }
});

// strict rate limiter for sensitive endpoints like ai generation
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 20, // only 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate limit exceeded for sensitive endpoint." }
});

// progressive delay middleware to slow down high request volumes
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per window without delay
  delayMs: () => 500, // add 500ms delay per request after delayafter
  maxDelayMs: 20000 // maximum delay of 20 seconds
});

// lenient limiter for api health check endpoint
const apiHealthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for health checks
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: "api health check rate limit exceeded." }
});

// search specific limiter for autocomplete endpoints
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 search requests per minute (generous for autocomplete)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "search rate limit exceeded. please slow down.", items: [] },
  skip: (req) => {
    // skip rate limiting for very short queries (they return empty anyway)
    const query = req.query.q;
    return !query || query.length < 3;
  }
});

module.exports = { 
  generalLimiter,
  strictLimiter, 
  speedLimiter,
  apiHealthCheckLimiter,
  searchLimiter
};
