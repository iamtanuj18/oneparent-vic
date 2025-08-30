const { CONFIG } = require("../config");
const { Pool } = require("pg");

let pool = null;

function getPool() {
  if (!CONFIG.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: CONFIG.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Heroku PG
    });
  }
  return pool;
}

async function ping() {
  const p = getPool();
  if (!p) return false;
  const res = await p.query("SELECT 1");
  return !!res;
}

module.exports = { getPool, ping };
