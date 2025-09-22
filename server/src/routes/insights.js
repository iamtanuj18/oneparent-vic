// insights api endpoints for community data visualization
const express = require("express");
const { getPool } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// security middleware for insights routes
router.use((req, res, next) => {
  // prevent caching of sensitive data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  // set content type to json only
  res.set('Content-Type', 'application/json; charset=utf-8');
  
  next();
});

// latest single-parent family count in Victoria
router.get("/insights/families-latest", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT year, ROUND(SUM(total_families_thousands)::numeric, 1) AS total_families_k
    FROM trends.victoria_one_parent_families
    WHERE year NOT IN (2019,2020,2021,2022)
    GROUP BY year
    ORDER BY year DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql);
  if (rows.length === 0) return res.status(404).json({ error: "No data found" });
  res.json({
    year: Number(rows[0].year),
    total_families_k: Number(rows[0].total_families_k)
  });
}));

// timeline milestone years for community visualization
router.get("/insights/timeline", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    WITH cleaned AS (
      SELECT
        year,
        SUM(total_families_thousands)::numeric AS total_families_k,
        SUM(families_dependants_0_14_thousands)::numeric AS families_with_young_dependants_k
      FROM trends.victoria_one_parent_families
      WHERE year NOT IN (2019,2020,2021,2022)
      GROUP BY year
    ),
    stats AS (
      SELECT MIN(year) AS min_year, MAX(year) AS max_year, COUNT(*) AS n_years
      FROM cleaned
    ),
    pivots AS (
      SELECT year FROM cleaned
      WHERE year IN (
        (SELECT min_year FROM stats),
        (SELECT max_year FROM stats),
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4    FROM stats) LIMIT 1),
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4*2  FROM stats) LIMIT 1),
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4*3  FROM stats) LIMIT 1)
      )
    )
    SELECT
      c.year,
      ROUND(c.total_families_k,1) AS total_families_k,
      ROUND(c.families_with_young_dependants_k,1) AS families_with_young_dependants_k
    FROM cleaned c
    JOIN pivots p USING (year)
    ORDER BY c.year
  `;
  const { rows } = await pool.query(sql);
  const timelineData = rows.map(r => ({
    year: Number(r.year),
    total_families_k: Number(r.total_families_k),
    dependants_k: Number(r.families_with_young_dependants_k)
  }));
  res.json(timelineData);
}));

// parenting payment latest recipients in Victoria
router.get("/insights/pps-latest", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT date, "VIC_recipients" AS vic_recipients
    FROM trends.pps_ts_data
    ORDER BY date DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql);
  if (!rows.length) return res.status(404).json({ error: "No data found" });
  res.json({ 
    date: rows[0].date, 
    vic_recipients: Number(rows[0].vic_recipients) 
  });
}));

// parenting payment trend data for modal visualization
router.get("/insights/pps-trend", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT date, "VIC_recipients" as vic_recipients
    FROM trends.pps_ts_data
    WHERE date >= (
      SELECT date 
      FROM trends.pps_ts_data 
      WHERE date <= CURRENT_DATE 
      ORDER BY date DESC 
      LIMIT 1 
      OFFSET (4 * 12 - 1)
    )
    ORDER BY date
  `;
  const { rows } = await pool.query(sql);
  const cleanData = rows.map(r => ({
    date: r.date,
    vic_total: Number(r.vic_recipients) || 0
  }));
  res.json(cleanData);
}));

// highest parenting payment suburb for card display
router.get("/insights/pps-hotspot", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT suburb, recipients
    FROM trends.vic_pps_by_postcode_with_suburb
    WHERE suburb IS NOT NULL
    ORDER BY recipients DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql);
  if (!rows.length) return res.status(404).json({ error: "No data found" });
  const firstSuburb = rows[0].suburb ? rows[0].suburb.split(',')[0].trim() : 'Unknown';
  res.json({ 
    suburb: firstSuburb,
    recipients: Number(rows[0].recipients) 
  });
}));

// all suburbs with coordinates for map visualization
router.get("/insights/pps-hotspot-detail", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT suburb, long, lat, recipients
    FROM trends.vic_pps_by_postcode_with_suburb
    WHERE suburb IS NOT NULL 
      AND long IS NOT NULL 
      AND lat IS NOT NULL
    ORDER BY recipients DESC
  `;
  const { rows } = await pool.query(sql);
  res.json(rows.map(r => ({
    suburb: r.suburb ? r.suburb.split(',')[0].trim() : 'Unknown',
    longitude: Number(r.long),
    latitude: Number(r.lat),
    recipients: Number(r.recipients)
  })));
}));

// latest labour force participation percentage
router.get("/insights/labour-latest", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT
        year,
        ROUND(
          (
            SUM(
              CASE WHEN labour_force_status IN ('Employed parent','Unemployed parent')
                   THEN total_families_thousands ELSE 0 END
            )
            / NULLIF(
                SUM(
                  CASE WHEN labour_force_status IN
                       ('Employed parent','Unemployed parent','Parent not in the labour force')
                       THEN total_families_thousands ELSE 0 END
                ), 0
            ) * 100
          )::numeric,
          1
        ) AS labour_pct
    FROM trends.victoria_labour_families
    WHERE family_type = 'One parent families - Summary'
    GROUP BY year
    ORDER BY year DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(sql);
  if (!rows.length) return res.status(404).json({ error: "No data found" });
  res.json({
    year: Number(rows[0].year),
    labour_pct: Number(rows[0].labour_pct)
  });
}));

// employment comparison between single parents and couple families
router.get("/insights/labour-breakdown", asyncHandler(async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }
  
  const sql = `
    SELECT 
      year,
      family_type,
      labour_force_status AS status,
      ROUND(SUM(total_families_thousands)::numeric, 1) AS families_k,
      ROUND(SUM(families_with_children_0_14_thousands)::numeric, 1) AS with_children_k
    FROM trends.victoria_labour_families
    WHERE family_type IN ('One parent families - Summary', 'Couple families - Summary')
      AND labour_force_status NOT IN ('One parent families', 'Couple families')
      AND year >= (SELECT MAX(year) - 1 FROM trends.victoria_labour_families WHERE family_type = 'One parent families - Summary')
    GROUP BY year, family_type, labour_force_status
    ORDER BY year DESC, family_type, families_k DESC
  `;
  const { rows } = await pool.query(sql);
  res.json(rows.map(r => ({
    year: Number(r.year),
    family_type: r.family_type.replace(' - Summary', ''),
    status: r.status,
    families_k: Number(r.families_k),
    with_children_k: Number(r.with_children_k)
  })));
}));

module.exports = router;

module.exports = router;
