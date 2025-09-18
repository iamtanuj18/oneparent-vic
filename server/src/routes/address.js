// server/src/routes/address.js
const express = require("express");
const router = express.Router();
// get query function for database access
const { query } = require("../db");

// get all unique suburbs for frontend autocomplete
router.get("/suburb-list-all", async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT suburb
      FROM vic_geo.vic_suburb_list
      WHERE suburb IS NOT NULL AND suburb <> ''
      ORDER BY suburb ASC
    `;
    const { rows } = await query(sql);
    return res.json({ items: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "lookup failed" });
  }
});

// GET 
// get a list of suburbs matching the search query
router.get("/suburb-list", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    // only search if query is at least 3 letters
    if (q.length < 3) return res.json({ items: [] });

    const sql = `
      SELECT id, suburb
      FROM vic_suburbs.vic_suburbs
      WHERE suburb ILIKE $1
      ORDER BY suburb ASC
      LIMIT 8
    `;
    const params = [`%${q}%`];

    // run the query and get results
    const { rows } = await query(sql, params);

    return res.json({ items: rows });
  } catch (e) {
    // failed to look up suburbs
    return res.status(500).json({ ok: false, message: "lookup failed" });
  }
});

// export the router
module.exports = router;
