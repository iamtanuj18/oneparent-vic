// server/src/db/index.js
const { CONFIG } = require("../config");
const { Pool } = require("pg");

let pool;

/**
 * Initialise a singleton pg.Pool.
 * Keeps connection count within Heroku’s 20-connection cap.
 */
function getPool() {
  if (!CONFIG.DATABASE_URL) {
    console.warn("[db] DATABASE_URL is not set");
    return null;
  }

  if (!pool) {
  pool = new Pool({
    connectionString: CONFIG.DATABASE_URL,
    max: Number(CONFIG.PG_POOL_MAX || (CONFIG.NODE_ENV === "production" ? 7 : 5)),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  pool.on("error", (err) => {
      console.error("[db] Unexpected error on idle client", err);
    });
  }

  return pool;
}

/**
 *  connectivity check.
 */
async function ping() {
  try {
    const p = getPool();
    if (!p) return false;
    const res = await p.query("SELECT 1");
    return !!res;
  } catch (e) {
    console.error("[db] ping failed:", e?.message || e);
    return false;
  }
}

/**
 *  query  with parameter binding.
 */
async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DB not configured");
  return p.query(text, params);
}

/**
 *  close the pool
 */
async function close() {
  if (pool) {
    try {
      await pool.end();
      console.log("[db] pool closed");
    } catch (e) {
      console.warn("[db] pool.close() failed:", e?.message);
    } finally {
      pool = null;
    }
  }
}

module.exports = { getPool, query, ping, close };
