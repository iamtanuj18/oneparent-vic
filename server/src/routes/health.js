// use express for routing
const express = require("express");
const { CONFIG } = require("../config");

const router = express.Router();

// health check endpoint for the service
router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "oneparent-vic from " + CONFIG.API_ENV,
    time: new Date().toISOString()
  });
});

// export the router
module.exports = router;
