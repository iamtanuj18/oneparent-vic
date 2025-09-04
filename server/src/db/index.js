// server/src/db/index.js
const { CONFIG } = require("../config");
const { Pool } = require("pg");

let pool;

// make a single pool for database connections
function getPool() {
  if (!CONFIG.DATABASE_URL) {
    // database url is missing
    console.warn("[db] DATABASE_URL is not set");
    return null;
  }

  if (!pool) {
    // create the pool only once
    pool = new Pool({
      connectionString: CONFIG.DATABASE_URL,
      max: Number(CONFIG.PG_POOL_MAX || (CONFIG.NODE_ENV === "production" ? 7 : 5)),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // log errors from idle clients
    pool.on("error", (err) => {
      console.error("[db] Unexpected error on idle client", err);
    });
  }

  return pool;
}

// check if database is working
async function ping() {
  try {
    const p = getPool();
    if (!p) return false;
    // run a simple query to check connection
    const res = await p.query("SELECT 1");
    return !!res;
  } catch (e) {
    console.error("[db] ping failed:", e?.message || e);
    return false;
  }
}

// run a query with parameters
async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("DB not configured");
  // run the query using the pool
  return p.query(text, params);
}

// close the database pool
async function close() {
  if (pool) {
    try {
      await pool.end();
      // pool closed successfully
      console.log("[db] pool closed");
    } catch (e) {
      // could not close pool
      console.warn("[db] pool.close() failed:", e?.message);
    } finally {
      pool = null;
    }
  }
}

module.exports = { getPool, query, ping, close };
