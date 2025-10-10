// database connection pool management for oneparent vic api
const { CONFIG } = require("../config");
const { Pool } = require("pg");

let pool;

// create and return a singleton database connection pool
function getPool() {
  if (!CONFIG.DATABASE_URL) {
    console.warn("[db] database url is not configured");
    return null;
  }

  if (!pool) {
    // initialize connection pool with environment specific settings
    pool = new Pool({
      connectionString: CONFIG.DATABASE_URL,
      max: CONFIG.PG_POOL_MAX || (CONFIG.NODE_ENV === "production" ? 7 : 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      // ssl config for aws rds - accept self-signed certificates
      ssl: {
        rejectUnauthorized: false,
        require: true,
      },
    });

    // handle unexpected errors from idle database connections
    pool.on("error", (err) => {
      console.error("[db] unexpected error on idle client", err);
    });
  }

  return pool;
}

// test database connection health
async function ping() {
  try {
    const p = getPool();
    if (!p) return false;
    
    // execute simple query to verify connection
    const res = await p.query("SELECT 1");
    return !!res;
  } catch (e) {
    console.error("[db] ping failed:", e?.message || e);
    return false;
  }
}

// execute sql query with optional parameters
async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error("database not configured");
  
  // execute query using connection pool
  return p.query(text, params);
}

// gracefully close database connection pool
async function close() {
  if (pool) {
    try {
      await pool.end();
      console.log("[db] pool closed");
    } catch (e) {
      console.warn("[db] pool close failed:", e?.message);
    } finally {
      pool = null;
    }
  }
}

module.exports = { getPool, query, ping, close };
