const express = require("express");
const router = express.Router();

const { getTicketmasterEvents } = require("../services/ticketmasterService.js");
const CATEGORY_MAP = require("../utils/categoryMapping");

router.post("/get-events", async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      ticketmasterPage = 0,
      perPage = 6,
    } = req.body;

    // Check if this category has Ticketmaster keywords
    const tmCfg = CATEGORY_MAP?.[category]?.ticketmaster;
    const hasTmKeywords =
      Array.isArray(tmCfg?.keywords) && tmCfg.keywords.length > 0;

    let ticketmasterResults = [];
    if (hasTmKeywords) {
      ticketmasterResults = await getTicketmasterEvents({
        category,
        dateFrom: startDate,
        dateTo: endDate,
        page: ticketmasterPage,
        perPage,
      });
    } else {
      console.log(
        `[Ticketmaster] Skipped (category="${category}", hasKeywords=${hasTmKeywords})`
      );
    }

    const pagination = {
      ticketmasterPage,
      ticketmasterHasMore:
        hasTmKeywords && ticketmasterResults.length === perPage,
    };

    res.json({
      count: ticketmasterResults.length,
      events: ticketmasterResults,
      pagination,
    });
  } catch (err) {
    console.error("Event search failed:", err.message);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

module.exports = router;