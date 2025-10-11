const { Redis: UpstashRedis } = require("@upstash/redis");
const Redis = require("ioredis");
const { CONFIG } = require("../config");

// RedisService manages atomic rate limiting for Gemini API keys
// Uses Upstash Redis for minute and day counters with safety buffers
// Caches shuffled key order per minute to reduce CPU overhead
class RedisService {
  constructor() {
    if (CONFIG.API_ENV === "aws-prod" || CONFIG.API_ENV === "local") {
      // Determine Redis host based on environment:
      // local: localhost (with SSH tunnel to EC2 Redis)
      // aws-prod: oneparent-redis (Docker container name)
      const redisHost = CONFIG.API_ENV === "aws-prod" ? "oneparent-redis" : "localhost";
      
      console.log(` [Redis] Initializing Redis connection - Environment: ${CONFIG.API_ENV}, Host: ${redisHost}`);
      
      this.redis = new Redis({
        host: redisHost,
        port: 6379,
        password: CONFIG.REDIS_PASSWORD,
      });

      // Add connection event listeners for debugging
      this.redis.on('connect', () => {
        console.log(' [Redis] Successfully connected to Redis server');
      });
      
      this.redis.on('error', (err) => {
        console.error('  [Redis] Connection error:', err.message);
      });
    } else {
      console.log(` [Redis] Using Upstash Redis for environment: ${CONFIG.API_ENV}`);
      this.redis = new UpstashRedis({
        url: CONFIG.UPSTASH_REDIS_REST_URL,
        token: CONFIG.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    this._shuffleCache = null;
  }

  // Choose the best API key and reserve a slot atomically
  async getBestApiKey(model) {
    const keys = this.getAllApiKeys();
    if (!keys.length) throw new Error("No Gemini API keys configured");

    const tier         = this.getModelTier(model);
    const minuteWindow = this.getCurrentMinute();
    const dayWindow    = this.getCurrentDay();
    const limits       = this.getModelLimits(tier);

    console.log(` [Redis] Key rotation request - Model: ${model}, Tier: ${tier}, Available keys: ${keys.length}`);

    // Use cached shuffled keys to spread load evenly
    const shuffled = this.getShuffledKeys(minuteWindow);
    console.log(` [Redis] Using shuffled key order for minute ${minuteWindow} (${shuffled.length} keys)`);

    for (const k of shuffled) {
      const h    = this.hashKey(k);
      const mKey = `rate_limit:${h}:${tier}:minute:${minuteWindow}`;
      const dKey = `rate_limit:${h}:${tier}:day:${dayWindow}`;

      // Get current usage counts from Redis
      const [mCountRaw, dCountRaw] = await this.redis.mget(mKey, dKey);
      
      const mCount = parseInt(mCountRaw || 0, 10);
      const dCount = parseInt(dCountRaw || 0, 10);

      console.log(`[Redis] Key ${k.slice(-8)}... usage - Minute: ${mCount}/${limits.rpm}, Daily: ${dCount}/${limits.rpd}`);

      // Skip key if daily limit reached with safety buffer
      if (dCount >= limits.rpd - 1) {
        console.log(`  [Redis] Key ${k.slice(-8)}... skipped - daily limit reached`);
        continue;
      }

      // Try to reserve a minute slot atomically
      const newMinute = await this.redis.incr(mKey);
      
      if (newMinute > limits.rpm - 1) {
        // Minute limit exceeded so undo reservation and try next key
        await this.redis.decr(mKey);
        console.log(` [Redis] Key ${k.slice(-8)}... skipped - minute limit reached (${newMinute}/${limits.rpm})`);
        continue;
      }

      // Set expiry for minute counter if this is first use
      if (newMinute === 1)
        await this.redis.expire(mKey, this.getSecondsUntilNextMinute());

      // Increment daily counter and set expiry if needed
      await this.redis.incr(dKey);
      if (dCount === 0)
        await this.redis.expire(dKey, this.getSecondsUntil5AM());

      console.log(` [Redis] Selected key ${k.slice(-8)}... - New counts: Minute ${newMinute}/${limits.rpm}, Daily ${dCount + 1}/${limits.rpd}`);

      return {
        apiKey: k,
        keyInfo: {
          keyHash: h.slice(0, 8),
          minuteCount: newMinute,
          limits,
        },
      };
    }

    console.error(` [Redis] All ${keys.length} keys exhausted for model ${model} (${tier}) in minute ${minuteWindow}`);
    throw new Error("All keys exhausted for current window");
  }

  // Helper methods
  getAllApiKeys() { return CONFIG.GEMINI_API_KEYS || []; }

  // Cache shuffled key order per minute to spread load evenly
  getShuffledKeys(minuteWindow) {
    if (!this._shuffleCache || this._shuffleCache.minute !== minuteWindow) {
      this._shuffleCache = {
        minute: minuteWindow,
        keys: this.getAllApiKeys().slice().sort(() => Math.random() - 0.5),
      };
    }
    return this._shuffleCache.keys;
  }

  // Determine model tier from model name for rate limiting
  getModelTier(model) {
    if (model.includes("pro"))   return "pro";
    if (model.includes("lite"))  return "lite";
    if (model.includes("flash")) return "standard";
    return "flash";
  }

  // Get rate limits for each model tier
  getModelLimits(tier) {
    const limits = {
      pro:      { rpm: 5,  rpd: 100 },
      standard: { rpm: 10, rpd: 250 },
      lite:     { rpm: 15, rpd: 1000 },
      flash:    { rpm: 15, rpd: 200 },
    };
    return limits[tier] || limits.flash;
  }

  // Create hash from API key for Redis key naming
  hashKey(apiKey) {
    const last  = apiKey.slice(-8);
    const first = apiKey.slice(10, 16);
    return `${first}${last}`.slice(0, 16);
  }

  // Get current minute in Melbourne timezone for rate limiting
  getCurrentMinute() {
    const now = new Date(new Date().toLocaleString("en-US",
                    { timeZone: "Australia/Melbourne" }));
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}-${String(now.getHours()).padStart(2,"0")}-${String(now.getMinutes()).padStart(2,"0")}`;
  }

  // Get current day in Melbourne timezone accounting for 5AM reset
  getCurrentDay() {
    const now = new Date(new Date().toLocaleString("en-US",
                    { timeZone: "Australia/Melbourne" }));
    const d = new Date(now);
    if (now.getHours() < 5) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }

  // Calculate seconds until next minute for key expiry
  getSecondsUntilNextMinute() {
    const now = new Date(new Date().toLocaleString("en-US",
                    { timeZone: "Australia/Melbourne" }));
    return 60 - now.getSeconds();
  }

  // Calculate seconds until 5AM Melbourne time for daily key expiry
  getSecondsUntil5AM() {
    const now = new Date(new Date().toLocaleString("en-US",
                    { timeZone: "Australia/Melbourne" }));
    const next5 = new Date(now);
    next5.setHours(5, 0, 0, 0);
    if (now.getHours() >= 5) next5.setDate(next5.getDate() + 1);
    return Math.floor((next5 - now) / 1000);
  }
}

module.exports = new RedisService();
