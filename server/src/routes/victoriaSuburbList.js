// victoria suburb list for search autocomplete
const express = require("express");
const router = express.Router();
const { query } = require("../db");
const { asyncHandler } = require("../utils/asyncHandler");
const { searchLimiter } = require("../middleware/rateLimit");

// input validation and sanitization
function validateAndSanitizeQuery(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  // convert to string and trim whitespace
  const cleaned = String(input).trim();
  
  // reject if too short or too long (prevent abuse)
  if (cleaned.length < 3 || cleaned.length > 50) {
    return null;
  }
  
  // allow only letters, spaces, hyphens, and apostrophes (common in suburb names)
  // this prevents injection attempts while allowing legitimate suburb names
  const sanitized = cleaned.replace(/[^a-zA-Z\s\-']/g, '');
  
  // reject if sanitization removed too much (likely malicious input)
  if (sanitized.length < 3 || sanitized.length < cleaned.length * 0.8) {
    return null;
  }
  
  return sanitized;
}

// get victoria suburbs matching the search query
router.get("/suburb-list", searchLimiter, asyncHandler(async (req, res) => {
  const rawQuery = req.query.q;
  
  // validate and sanitize input
  const q = validateAndSanitizeQuery(rawQuery);
  if (!q) {
    return res.json({ items: [] });
  }

  // use parameterized query to prevent sql injection
  const sql = `
    SELECT id, suburb
    FROM vic_geo.vic_suburb_list
    WHERE suburb ILIKE $1
    ORDER BY suburb ASC
    LIMIT 8
  `;
  const params = [`%${q}%`];

  try {
    // run the query and get results
    const { rows } = await query(sql, params);
    
    // sanitize output to prevent xss (though suburbs should be safe)
    const sanitizedRows = rows.map(row => ({
      id: parseInt(row.id, 10), // ensure id is integer
      suburb: String(row.suburb).trim() // ensure suburb is clean string
    }));

    return res.json({ items: sanitizedRows });
    
  } catch (dbError) {
    // log error for monitoring but don't expose details to client
    console.error('[suburb-list] database error:', dbError);
    return res.status(500).json({ 
      error: 'Search temporarily unavailable',
      items: [] 
    });
  }
}));

// export the router
module.exports = router;