const express = require("express");
const { getPool } = require("../db");

const router = express.Router();

// helpers for state and number formatting
const normState = (s) => {
  const v = String(s || "").trim();
  if (!v) return v;
  const up = v.toUpperCase();
  if (up === "VIC") return "Victoria";
  if (up === "NSW") return "New South Wales";
  if (up === "QLD") return "Queensland";
  if (up === "SA") return "South Australia";
  if (up === "WA") return "Western Australia";
  if (up === "TAS") return "Tasmania";
  if (up === "ACT") return "Australian Capital Territory";
  if (up === "NT") return "Northern Territory";
  return v;
};
const toNum = (v) => {
  const n = Number(String(v ?? "").replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// endpoint for hero snapshot numbers
router.post("/hero", async (req, res) => {
  try {
    const { state = "VIC" } = req.body || {};
    const sLong = normState(state);
    const pool = getPool();

  // get total families for latest year
    const q1 = `
      SELECT total_families_thousands AS total
      FROM trends.victoria_one_parent_families
      WHERE state ILIKE $1
        AND lower(family_type) LIKE '%one parent%'
      ORDER BY year DESC
      LIMIT 1
    `;
    const r1 = await pool.query(q1, [sLong]);
    const total_k = toNum(r1.rows?.[0]?.total);

  // get percent single-parent families for latest year
    const q2 = `
      WITH latest AS (
        SELECT MAX(year) AS y FROM trends.victoria_labour_families
        WHERE state ILIKE $1
      ),
      agg AS (
        SELECT
          SUM(CASE WHEN lower(family_type) LIKE '%one parent%' THEN total_families_thousands ELSE 0 END) AS one_p,
          SUM(CASE WHEN lower(family_type) LIKE '%couple%' THEN total_families_thousands ELSE 0 END)     AS couple_p
        FROM trends.victoria_labour_families, latest
        WHERE state ILIKE $1 AND year = latest.y
      )
      SELECT CASE WHEN couple_p = 0 THEN 0 ELSE (one_p / couple_p) * 100 END AS pct_single FROM agg
    `;
    const r2 = await pool.query(q2, [sLong]);
    const pct_single_parents = Math.round(Number(r2.rows?.[0]?.pct_single) || 0);

  // get percent growth from earliest to latest year
    const q3 = `
      WITH bounds AS (
        SELECT
          MIN(year) AS y_min,
          MAX(year) AS y_max
        FROM trends.victoria_one_parent_families
        WHERE state ILIKE $1
          AND lower(family_type) LIKE '%one parent%'
      ),
      vals AS (
        SELECT
          MAX(CASE WHEN year = (SELECT y_max FROM bounds) THEN total_families_thousands END) AS latest_val,
          MAX(CASE WHEN year = (SELECT y_min FROM bounds) THEN total_families_thousands END) AS earliest_val
        FROM trends.victoria_one_parent_families
        WHERE state ILIKE $1
          AND lower(family_type) LIKE '%one parent%'
      )
      SELECT CASE WHEN earliest_val = 0 OR earliest_val IS NULL
             THEN 0
             ELSE ((latest_val - earliest_val) / earliest_val) * 100
           END AS pct_increase
      FROM vals
    `;
    const r3 = await pool.query(q3, [sLong]);
    const pct_growth_since_start = Math.round(Number(r3.rows?.[0]?.pct_increase) || 0);

  // get percent of working parents in one-parent families
    const q4 = `
      WITH latest AS (
        SELECT MAX(year) AS y FROM trends.victoria_labour_families
        WHERE state ILIKE $1
      ),
      base AS (
        SELECT
          SUM(CASE WHEN lower(family_type) LIKE '%one parent%' THEN total_families_thousands ELSE 0 END) AS total_one_parent,
          SUM(CASE WHEN lower(family_type) LIKE '%one parent%' AND lower(labour_force_status) LIKE 'employ%'
                   THEN total_families_thousands ELSE 0 END) AS employed_parent
        FROM trends.victoria_labour_families, latest
        WHERE state ILIKE $1 AND year = latest.y
      )
      SELECT CASE WHEN total_one_parent = 0 THEN 0
                  ELSE (employed_parent / total_one_parent) * 100
             END AS pct_working
      FROM base
    `;
    const r4 = await pool.query(q4, [sLong]);
    const pct_working_parent = Math.round(Number(r4.rows?.[0]?.pct_working) || 0);

    return res.json({
      state: sLong,
      total_k,
      pct_single_parents,
      pct_growth_since_start,
      pct_working_parent,
    });
  } catch (err) {
    console.error("[hero] db error:", err);
    return res.status(500).json({ error: "db query failed" });
  }
});

// endpoint for overview snapshot
router.post("/overview", async (req, res) => {
  const { state } = req.body || {};
  if (!state) return res.status(400).json({ error: "state required" });
  const s = normState(state);

  try {
    const pool = getPool();
    const sql = `
      SELECT
        year::int AS year,
        total_families_thousands                    AS total,
        families_dependants_0_14_thousands         AS child_0_14
      FROM trends.victoria_one_parent_families
      WHERE state ILIKE $1
        AND lower(family_type) LIKE '%one parent%'
      ORDER BY year DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [s]);

    if (!rows[0]) {
      return res.json({
        state: s, year: null,
        total_families: 0,
        with_dependants_0_24: 0, // not available in this table; keep 0 for shape compatibility
        with_children_0_14: 0,
        without_dependants: 0,   // not available; keep 0
      });
    }
    const r = rows[0];
    res.json({
      state: s,
      year: r.year,
      total_families: toNum(r.total),
      with_dependants_0_24: 0,
      with_children_0_14: toNum(r.child_0_14),
      without_dependants: 0,
    });
  } catch (err) {
    console.error("[overview] db error:", err);
    res.status(500).json({ error: "db query failed" });
  }
});

// endpoint for yearly trends series
router.post("/trends", async (req, res) => {
  const { state } = req.body || {};
  if (!state) return res.status(400).json({ error: "state required" });
  const s = normState(state);

  try {
    const pool = getPool();
    const sql = `
      SELECT
        year::int AS year,
        total_families_thousands            AS total_families,
        families_dependants_0_14_thousands  AS with_children_0_14
      FROM trends.victoria_one_parent_families
      WHERE state ILIKE $1
        AND lower(family_type) LIKE '%one parent%'
      ORDER BY year
    `;
    const { rows } = await pool.query(sql, [s]);
    rows.forEach((r) => {
      r.total_families = toNum(r.total_families);
      r.with_children_0_14 = toNum(r.with_children_0_14);
    });
    res.json(rows);
  } catch (err) {
    console.error("[trends] db error:", err);
    res.status(500).json({ error: "db query failed" });
  }
});

// endpoint for labour bars by year
router.post("/labour-bars", async (req, res) => {
  const { state, year } = req.body || {};
  if (!state || !year) return res.status(400).json({ error: "state & year required" });
  const s = normState(state);

  try {
    const pool = getPool();
    const sql = `
      SELECT
        lower(family_type) AS family_type,
        lower(labour_force_status) AS lfs,
        families_with_children_0_14_thousands AS val
      FROM trends.victoria_labour_families
      WHERE state ILIKE $1 AND year = $2
    `;
    const { rows } = await pool.query(sql, [s, year]);

    // helper to pick value by keyword
    const pick = (arr, keyword) => {
      const row = arr.find((r) => (r.lfs || "").includes(keyword));
      return toNum(row?.val);
    };

  // filter rows for couple and single-parent families
  const coupleRows = rows.filter((r) => (r.family_type || "").includes("couple"));
  const singleRows = rows.filter((r) => (r.family_type || "").includes("one parent"));

    // build couple and single-parent bar data
    const couple = [
      { name: "Both parents employed", value: pick(coupleRows, "both") },
      { name: "At least one partner employed", value: pick(coupleRows, "at least") || pick(coupleRows, "one") },
      { name: "Neither partner employed", value: pick(coupleRows, "neither") || pick(coupleRows, "not in the labour") || pick(coupleRows, "not in the labor") },
    ];

    const single = [
      { name: "Parent employed", value: pick(singleRows, "employ") },
      { name: "Unemployed parent", value: pick(singleRows, "unemploy") },
      { name: "Parent not in the labour force", value: pick(singleRows, "not in the labour") || pick(singleRows, "not in the labor") || pick(singleRows, "nilf") },
    ];

    res.json({ state: s, year: Number(year), couple, single });
  } catch (err) {
    console.error("[labour-bars] db error:", err);
    res.status(500).json({ error: "db query failed" });
  }
});

// endpoint for latest pps snapshot
router.post("/pps/latest", async (_req, res) => {
  try {
    const pool = getPool();
    const sql = `
      SELECT
        date::date                          AS dt,
        total_recipients                    AS all_recipients,
        male_recipients                     AS male,
        female_recipients                   AS female,
        recipients_without_earnings         AS no_earnings,
        recipients_with_earnings            AS had_earnings,
        vic_recipients                      AS state_recipients
      FROM trends.pps_ts_data
      ORDER BY date::date DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(sql);
    if (!rows[0]) return res.json({});
    const r = rows[0];
    res.json({
      date: r.dt.toISOString().slice(0, 10),
      state: "Victoria",
      state_recipients: toNum(r.state_recipients),
      all_recipients: toNum(r.all_recipients),
      male: toNum(r.male),
      female: toNum(r.female),
      no_earnings: toNum(r.no_earnings),
      had_earnings: toNum(r.had_earnings),
    });
  } catch (err) {
    console.error("[pps latest] db error:", err);
    res.status(500).json({ error: "db query failed" });
  }
});

// endpoint for pps trends monthly series
router.post("/pps/trends", async (req, res) => {
  try {
    const { state = "VIC", metric = "state_total" } = req.body || {};
    const S = String(state || "VIC").toUpperCase();

  // build quoted identifier for state-specific column
    const stateColIdent = `"${S}_recipients"`;

  // map metric to column expression
    const metricToColumn = (m) => {
      switch ((m || "").toLowerCase()) {
        case "state_total":   return stateColIdent; // quoted, preserves case
        case "all_total":     return "total_recipients";
        case "male":          return "male_recipients";
        case "female":        return "female_recipients";
        case "had_earnings":  return "recipients_with_earnings";
        case "no_earnings":   return "recipients_without_earnings";
        default:              return stateColIdent;
      }
    };

  // get column expression for query
  const colExpr = metricToColumn(metric);

    const pool = getPool();
    const sql = `
      SELECT date::date AS dt, ${colExpr} AS value
      FROM trends.pps_ts_data
      ORDER BY date::date
    `;
    const { rows } = await pool.query(sql);

    const series = rows.map((r) => ({
      date: r.dt.toISOString().slice(0, 10),
      yearMonth: r.dt.toISOString().slice(0, 7),
      value: Number(r.value) || 0,
    }));

    res.json(series);
  } catch (err) {
    console.error("[pps trends] db error:", err);
    res.status(500).json({ error: "db query failed" });
  }
});


module.exports = router;
