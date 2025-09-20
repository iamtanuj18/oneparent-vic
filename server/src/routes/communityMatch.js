// Community matching + map data related API (merged routes)
const express = require("express");
const router = express.Router();
const { getPool } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");
const { query } = require("../db/index");

// ---- Centralized table names ----
const T = {
  langCount: "languages_lga", // columns: language, council, population
  suburbs:   "suburbs",       // columns: council, suburb, postcode
  housing:   "housing",       // columns: suburb, rent_allprop, buy_flat, buy_house, ...
  schools:   "schools",       // columns: address_town, school_name, school_type, education_sector, lat, lon, ...
};

// GET /api/community/languages  -> Dropdown list of available languages
router.get("/languages", asyncHandler(async (_req, res) => {
  const { rows } = await query(
     `SELECT DISTINCT language FROM community.languages_lga ORDER BY language ASC`
  );
  res.json(rows.map(r => r.language));
}));

// GET /api/community/top3?language=Chinese  -> Top 3 LGAs for a given language
router.get("/top3", asyncHandler(async (req, res) => {
  const language = req.query.language;
  if (!language) return res.status(400).json({ error: "language required" });
  const { rows } = await query(
      `SELECT council, population
         FROM community.languages_lga
        WHERE language = $1
        ORDER BY population DESC
        LIMIT 3`,
    [language]
  );
  res.json(rows.map((r, i) => ({ council: r.council, population: r.population, rank: i + 1 })));
}));

// GET /api/community/lga/:council/suburbs  -> List of suburbs in a specific LGA
router.get("/lga/:council/suburbs", asyncHandler(async (req, res) => {
  const council = decodeURIComponent(req.params.council);
  const { rows } = await query(
    `SELECT suburb, postcode
       FROM community.council_suburbs
      WHERE council = $1
      ORDER BY suburb ASC`,
    [council]
  );
  res.json(rows);
}));

// GET /api/community/suburb/:name/summary  -> Show housing summary when suburb is clicked the first time
router.get("/suburb/:name/summary", asyncHandler(async (req, res) => {
  const name = decodeURIComponent(req.params.name || "").trim();

  // Note: Some datasets may include punctuation or inconsistent casing in suburb names.
  // Use regex to remove non-alphanumeric characters before matching to improve hit rate.
  const { rows } = await query(
    `SELECT suburb, rent_allprop, buy_flat, buy_house
       FROM community.rent_sale
      WHERE lower(regexp_replace(suburb, '[^a-z0-9]+', '', 'g')) = lower(regexp_replace($1, '[^a-z0-9]+', '', 'g'))
         OR lower(suburb) = lower($1)
      LIMIT 1`,
    [name]
  );

  if (!rows[0]) return res.json({ notFound: true });

  const r = rows[0];
  const medianHousing = r.buy_house ?? r.buy_flat ?? r.rent_allprop ?? null;
  res.json({
    suburb: r.suburb,
    medianHousing,
    rent_allprop: r.rent_allprop,
    buy_flat: r.buy_flat,
    buy_house: r.buy_house,
  });
}));

// GET /api/community/suburb/:name/schools  -> Show school list when suburb is clicked a second time
router.get("/suburb/:name/schools", asyncHandler(async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const { rows } = await query(
    `SELECT school_name, school_type, education_sector, lat, lon, address_postcode
       FROM community.schools
      WHERE lower(address_town) = lower($1)
      ORDER BY school_name ASC`,
    [name]
  );
  res.json(rows);
}));

module.exports = router;
