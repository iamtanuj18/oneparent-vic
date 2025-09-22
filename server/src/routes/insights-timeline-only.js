const express = require("express");
const { getPool } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// endpoint for timeline milestone years
router.get("/insights/timeline", asyncHandler(async (req, res) => {
  const pool = getPool();
  
  // returns 5 milestone years with totals and dependants for victoria's
  // single-parent families, automatically spanning the entire clean data range
  const sql = `
    WITH cleaned AS (
      -- 1. filter out anomaly years and aggregate by year
      SELECT
        year,
        SUM(total_families_thousands)::numeric AS total_families_k,
        SUM(families_dependants_0_14_thousands)::numeric AS families_with_young_dependants_k
      FROM trends.victoria_one_parent_families
      WHERE year NOT IN (2019,2020,2021,2022)      -- remove known anomalies
      GROUP BY year
    ),
    stats AS (
      -- 2. compute range and count of valid years
      SELECT
        MIN(year) AS min_year,
        MAX(year) AS max_year,
        COUNT(*)  AS n_years
      FROM cleaned
    ),
    pivots AS (
      -- 3. select the 5 milestone years:
      -- earliest, latest, and three evenly spaced quartile points
      SELECT year FROM cleaned
      WHERE year IN (
        (SELECT min_year FROM stats),                        -- earliest
        (SELECT max_year FROM stats),                        -- latest
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4    FROM stats) LIMIT 1),  -- 1st quartile
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4*2  FROM stats) LIMIT 1),  -- median
        (SELECT year FROM cleaned ORDER BY year
           OFFSET (SELECT n_years/4*3  FROM stats) LIMIT 1)   -- 3rd quartile
      )
    )
    -- 4. return the chosen years with their metrics, ordered chronologically
    SELECT
      c.year,
      ROUND(c.total_families_k,1)           AS total_families_k,
      ROUND(c.families_with_young_dependants_k,1) AS families_with_young_dependants_k
    FROM cleaned c
    JOIN pivots  p USING (year)
    ORDER BY c.year
  `;

  const { rows } = await pool.query(sql);

  // calculate change percentage from previous milestone
  const timelineData = rows.map((row, index) => {
    let change_pct_from_previous = null;
    if (index > 0) {
      const previousValue = rows[index - 1].total_families_k;
      const currentValue = row.total_families_k;
      if (previousValue > 0) {
        change_pct_from_previous = Math.round(((currentValue - previousValue) / previousValue) * 100);
      }
    }

    return {
      year: Number(row.year),
      total_families_k: Number(row.total_families_k),
      dependants_k: Number(row.families_with_young_dependants_k),
      change_pct_from_previous
    };
  });

  res.json(timelineData);
}));

module.exports = router;