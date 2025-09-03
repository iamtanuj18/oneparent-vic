// server/src/routes/address.js
const express = require("express");
const router = express.Router();
const { query } = require("../db");

// GET 
router.get("/suburb-list", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) return res.json({ items: [] });

    const sql = `
      SELECT id, suburb
      FROM vic_suburbs.vic_suburbs
      WHERE suburb ILIKE $1
      ORDER BY suburb ASC
      LIMIT 8
    `;
    const params = [`%${q}%`];

    const { rows } = await query(sql, params);

    return res.json({ items: rows });
  } catch (e) {
    console.error("[suburb-list] failed", e);
    return res.status(500).json({ ok: false, message: "Lookup failed" });
  }
});

module.exports = router;
