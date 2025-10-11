// api health check endpoint for service monitoring
const express = require("express");
const { CONFIG } = require("../config");
const { apiHealthCheckLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// health check endpoint for the api service
router.get("/api-status", apiHealthCheckLimiter, (_req, res) => {
  res.json({
    ok: true,
    service: "oneparent vic api v9 from " + CONFIG.API_ENV,
    time: new Date().toISOString()
  });
});

// export the router
module.exports = router;