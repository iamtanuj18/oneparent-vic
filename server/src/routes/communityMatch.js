// server/src/routes/CommunityMatch.js
// Community matching + map data API (full, unified)

const express = require("express");
const router = express.Router();
const { query } = require("../db/index"); 

/* ------------------------- helpers ------------------------- */

function csvParam(v) {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.split(",").map(s => s.trim()).filter(Boolean);
}
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/* -------------------- 1) Languages & Top3 ------------------ */

// GET /api/community/languages
// community.languages_lga(language, council, population)
router.get("/languages", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT DISTINCT language
         FROM community.languages_lga
        ORDER BY language ASC`
    );
    res.json(rows.map(r => r.language));
  } catch (e) { next(e); }
});

// GET /api/community/top3?language=Chinese
router.get("/top3", async (req, res, next) => {
  try {
    const language = String(req.query.language || "").trim();
    if (!language) return res.json([]);

    const { rows } = await query(
      `SELECT council, population
         FROM community.languages_lga
        WHERE language = $1
        ORDER BY population DESC
        LIMIT 3`,
      [language]
    );
    res.json(rows.map((r, i) => ({
      rank: i + 1,
      council: r.council,
      population: Number(r.population || 0),
    })));
  } catch (e) { next(e); }
});

/* ---------------- 2) Council -> Suburbs  --------------- */

// GET old route：/lga/:council/suburbs
router.get("/lga/:council/suburbs", async (req, res, next) => {
  try {
    const council = decodeURIComponent(req.params.council || "");
    const { rows } = await query(
      `SELECT suburb, postcode
         FROM community.council_suburbs
        WHERE council = $1
        ORDER BY suburb ASC`,
      [council]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// new route：/council/:lga/suburbs
router.get("/council/:lga/suburbs", async (req, res, next) => {
  try {
    const lga = decodeURIComponent(req.params.lga || "");
    const { rows } = await query(
      `SELECT suburb, postcode
         FROM community.council_suburbs
        WHERE council = $1
        ORDER BY suburb ASC`,
      [lga]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/* ---------------- 3) Suburb summary & schools -------------- */

// GET /api/community/suburb/:name/summary
// pull median prices from community.rent_sale
router.get("/suburb/:name/summary", async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.name || "").trim();
    if (!name) return res.json({ notFound: true });

    const { rows } = await query(
      `SELECT suburb, rent_allprop, buy_flat, buy_house
         FROM community.rent_sale
        WHERE lower(regexp_replace(suburb,'[^a-z0-9]+','','g')) = lower(regexp_replace($1,'[^a-z0-9]+','','g'))
           OR lower(suburb) = lower($1)
        LIMIT 1`,
      [name]
    );
    if (!rows[0]) return res.json({ suburb: name, notFound: true });

    const r = rows[0];
    const medianHousing =
      r.buy_house ?? r.buy_flat ?? r.rent_allprop ?? null;

    res.json({
      suburb: r.suburb,
      medianHousing: medianHousing !== null ? Number(medianHousing) : null,
      rent_allprop: r.rent_allprop != null ? Number(r.rent_allprop) : null,
      buy_flat: r.buy_flat != null ? Number(r.buy_flat) : null,
      buy_house: r.buy_house != null ? Number(r.buy_house) : null,
    });
  } catch (e) { next(e); }
});

// GET /api/community/suburb/:name/schools?types=..&levels=..
// community.schools(lga_name, address_town, education_sector, school_type, lat, lon, ...)
router.get("/suburb/:name/schools", async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.name || "");
    const types = csvParam(req.query.types);
    const levels = csvParam(req.query.levels);

    const params = [name];
    let where = `lower(address_town) = lower($1)`;
    if (types && types.length) { params.push(types); where += ` AND education_sector = ANY($${params.length})`; }
    if (levels && levels.length) { params.push(levels); where += ` AND school_type = ANY($${params.length})`; }

    const { rows } = await query(
      `SELECT school_no, school_name, school_type, education_sector,
              lat, lon, address_line_1, address_line_2, address_town, address_postcode, phone
         FROM community.schools
        WHERE ${where}
        ORDER BY school_name ASC`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/* ------------- 4) Schools aggregation (choropleth) --------- */

// GET /api/community/council/:lga/schools/agg?types=..&levels=..
router.get("/council/:lga/schools/agg", async (req, res, next) => {
  try {
    const lga = decodeURIComponent(req.params.lga || "");
    const types = csvParam(req.query.types);
    const levels = csvParam(req.query.levels);

    const params = [lga];
    let where = `lower(lga_name) = lower($1)`;
    if (types && types.length) { params.push(types); where += ` AND education_sector = ANY($${params.length})`; }
    if (levels && levels.length) { params.push(levels); where += ` AND school_type = ANY($${params.length})`; }

    const { rows } = await query(
      `SELECT lower(address_town) AS suburb, COUNT(*)::int AS n
         FROM community.schools
        WHERE ${where}
        GROUP BY 1
        ORDER BY 2 DESC`,
      params
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/* ---------------- 5) Housing medians & extremes ------------ */

// GET /api/community/council/:lga/housing/medians?tenure=&dwelling=&beds=
// 来源表建议：community.housing(lga_name, suburb, price, tenure, property_type, bedrooms)
router.get("/council/:lga/housing/medians", async (req, res, next) => {
  try {
    const lga = decodeURIComponent(req.params.lga || "");
    const tenure = String(req.query.tenure || "buy");
    const dwelling = String(req.query.dwelling || "House");
    const beds = Number(req.query.beds || 3);

    const { rows } = await query(
      `SELECT lower(suburb) AS suburb,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median
         FROM community.housing
        WHERE lower(lga_name) = lower($1)
          AND tenure = $2
          AND property_type = $3
          AND bedrooms = $4
        GROUP BY 1`,
      [lga, tenure, dwelling, beds]
    );
    res.json(rows.map(r => ({ suburb: r.suburb, median: Number(r.median) })));
  } catch (e) { next(e); }
});

// GET /api/community/council/:lga/housing/minmax?tenure=&dwelling=&beds=
router.get("/council/:lga/housing/minmax", async (req, res, next) => {
  try {
    const lga = decodeURIComponent(req.params.lga || "");
    const tenure = String(req.query.tenure || "buy");        // 'buy' | 'rent'
    const dwelling = String(req.query.dwelling || "House");  // 'House' | 'Flat'
    const beds = Number(req.query.beds || 3);

    const baseParams = [lga, tenure, dwelling, beds];

    const sql = (dir) => `
      WITH priced AS (
        SELECT lower(suburb) AS suburb,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median
          FROM community.housing
         WHERE lower(lga_name) = lower($1)
           AND tenure = $2
           AND property_type = $3
           AND bedrooms = $4
         GROUP BY 1
      )
      SELECT suburb, median AS price
        FROM priced
       WHERE median IS NOT NULL
       ORDER BY price ${dir}
       LIMIT 1`;

    const cheapQ = await query(sql("ASC"),  baseParams);
    const costlyQ = await query(sql("DESC"), baseParams);

    res.json({
      cheap:  cheapQ.rows[0]  ? { suburb: cheapQ.rows[0].suburb,  price: Number(cheapQ.rows[0].price) }  : undefined,
      costly: costlyQ.rows[0] ? { suburb: costlyQ.rows[0].suburb, price: Number(costlyQ.rows[0].price) } : undefined,
    });
  } catch (e) { next(e); }
});

/* ------------------------- export -------------------------- */

module.exports = router;

