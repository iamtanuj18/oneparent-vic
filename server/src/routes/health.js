const express = require("express");
const { CONFIG } = require("../config");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "oneparent-vic from " + CONFIG.NODE_ENV,
    time: new Date().toISOString()
  });
});

module.exports = router;
