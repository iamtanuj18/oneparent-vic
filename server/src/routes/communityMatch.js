// community matching api endpoints
const express = require("express");
const router = express.Router();
const { query } = require("../db/index");
const { asyncHandler } = require("../utils/asyncHandler");

// helper functions
function csvParam(v) {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

// get list of available languages
router.get("/languages", asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT DISTINCT language
     FROM community.languages_lga
     ORDER BY language ASC`
  );
  res.json(rows.map(r => r.language));
}));

// get top 3 councils by language
router.get("/top3", asyncHandler(async (req, res) => {
  const language = String(req.query.language || "").trim();
  if (!language) {
    return res.json([]);
  }

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
}));

// get suburbs for a council
router.get("/council/:lga/suburbs", asyncHandler(async (req, res) => {
  const lga = req.params.lga;
  if (!lga) {
    return res.status(400).json({ error: "Council name is required" });
  }

  const { rows } = await query(
    `SELECT suburb, postcode
     FROM community.council_suburbs
     WHERE council = $1
     ORDER BY suburb ASC`,
    [lga]
  );
  
  res.json(rows);
}));

// get suburb summary data
router.get("/suburb/:name/summary", asyncHandler(async (req, res) => {
  const name = req.params.name;
  if (!name) {
    return res.json({ notFound: true });
  }

  const { rows } = await query(
    `SELECT suburb, rent_allprop, buy_flat, buy_house
     FROM community.rent_sale
     WHERE LOWER(suburb) = LOWER($1)
     LIMIT 1`,
    [name]
  );

  if (!rows[0]) {
    return res.json({ suburb: name, notFound: true });
  }

  const r = rows[0];
  const medianHousing = r.buy_house ?? r.buy_flat ?? r.rent_allprop ?? null;

  res.json({
    suburb: r.suburb,
    medianHousing: medianHousing !== null ? Number(medianHousing) : null,
    rent_allprop: r.rent_allprop != null ? Number(r.rent_allprop) : null,
    buy_flat: r.buy_flat != null ? Number(r.buy_flat) : null,
    buy_house: r.buy_house != null ? Number(r.buy_house) : null,
  });
}));

// get schools for a suburb
router.get("/suburb/:name/schools", asyncHandler(async (req, res) => {
  const name = req.params.name;
  if (!name) {
    return res.status(400).json({ error: "Suburb name is required" });
  }

  const types = csvParam(req.query.types);
  const levels = csvParam(req.query.levels);

  let whereClause = `LOWER(address_town) = LOWER($1)`;
  const params = [name];

  if (types && types.length) {
    params.push(types);
    whereClause += ` AND education_sector = ANY($${params.length})`;
  }
  
  if (levels && levels.length) {
    params.push(levels);
    whereClause += ` AND school_type = ANY($${params.length})`;
  }

  const { rows } = await query(
    `SELECT school_no, school_name, school_type, education_sector,
            lat, lon, address_line_1, address_line_2, address_town, address_postcode, phone
     FROM community.schools
     WHERE ${whereClause}
     ORDER BY school_name ASC`,
    params
  );
  
  res.json(rows);
}));

// get school counts aggregation for choropleth
router.get("/council/:lga/schools/agg", asyncHandler(async (req, res) => {
  const lga = req.params.lga;
  if (!lga) {
    return res.status(400).json({ error: "Council name is required" });
  }

  const types = csvParam(req.query.types);
  const levels = csvParam(req.query.levels);

  let whereClause = `LOWER(lga_name) = LOWER($1)`;
  const params = [lga];

  if (types && types.length) {
    params.push(types);
    whereClause += ` AND education_sector = ANY($${params.length})`;
  }
  
  if (levels && levels.length) {
    params.push(levels);
    whereClause += ` AND school_type = ANY($${params.length})`;
  }

  const { rows } = await query(
    `SELECT LOWER(address_town) AS suburb, COUNT(*)::int AS n
     FROM community.schools
     WHERE ${whereClause}
     GROUP BY 1
     ORDER BY 2 DESC`,
    params
  );
  
  res.json(rows);
}));

// get housing median prices by council
router.get("/council/:lga/housing/medians", asyncHandler(async (req, res) => {
  const lga = req.params.lga;
  if (!lga) {
    return res.status(400).json({ error: "Council name is required" });
  }

  const tenure = String(req.query.tenure || "buy");
  const dwelling = String(req.query.dwelling || "House");
  const beds = parseInt(req.query.beds) || 3;

  // validate input parameters
  if (!["buy", "rent"].includes(tenure)) {
    return res.status(400).json({ error: "Tenure must be 'buy' or 'rent'" });
  }
  
  if (!["House", "Flat"].includes(dwelling)) {
    return res.status(400).json({ error: "Dwelling must be 'House' or 'Flat'" });
  }

  if (beds < 1 || beds > 10) {
    return res.status(400).json({ error: "Beds must be between 1 and 10" });
  }

  const { rows } = await query(
    `SELECT LOWER(suburb) AS suburb,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median
     FROM community.housing
     WHERE LOWER(lga_name) = LOWER($1)
       AND tenure = $2
       AND property_type = $3
       AND bedrooms = $4
     GROUP BY 1`,
    [lga, tenure, dwelling, beds]
  );
  
  res.json(rows.map(r => ({ 
    suburb: r.suburb, 
    median: Number(r.median) 
  })));
}));

// get housing price extremes by council
router.get("/council/:lga/housing/minmax", asyncHandler(async (req, res) => {
  const lga = req.params.lga;
  if (!lga) {
    return res.status(400).json({ error: "Council name is required" });
  }

  const tenure = String(req.query.tenure || "buy");
  const dwelling = String(req.query.dwelling || "House");
  const beds = parseInt(req.query.beds) || 3;

  // validate input parameters
  if (!["buy", "rent"].includes(tenure)) {
    return res.status(400).json({ error: "Tenure must be 'buy' or 'rent'" });
  }
  
  if (!["House", "Flat"].includes(dwelling)) {
    return res.status(400).json({ error: "Dwelling must be 'House' or 'Flat'" });
  }

  if (beds < 1 || beds > 10) {
    return res.status(400).json({ error: "Beds must be between 1 and 10" });
  }

  const baseParams = [lga, tenure, dwelling, beds];

  const createSql = (direction) => `
    WITH priced AS (
      SELECT LOWER(suburb) AS suburb,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median
      FROM community.housing
      WHERE LOWER(lga_name) = LOWER($1)
        AND tenure = $2
        AND property_type = $3
        AND bedrooms = $4
      GROUP BY 1
    )
    SELECT suburb, median AS price
    FROM priced
    WHERE median IS NOT NULL
    ORDER BY price ${direction}
    LIMIT 1`;

  const [cheapResult, costlyResult] = await Promise.all([
    query(createSql("ASC"), baseParams),
    query(createSql("DESC"), baseParams)
  ]);

  res.json({
    cheap: cheapResult.rows[0] ? { 
      suburb: cheapResult.rows[0].suburb, 
      price: Number(cheapResult.rows[0].price) 
    } : undefined,
    costly: costlyResult.rows[0] ? { 
      suburb: costlyResult.rows[0].suburb, 
      price: Number(costlyResult.rows[0].price) 
    } : undefined,
  });
}));

module.exports = router;
