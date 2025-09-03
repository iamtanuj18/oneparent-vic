// server/src/routes/events.providers.js
const express = require("express");
const router = express.Router();
const { getEventfindaEvents } = require("../services/eventfindaService.js");
const { getTicketmasterEvents } = require("../services/ticketmasterService.js");
const CATEGORY_MAP = require("../utils/categoryMapping");

// Ticketmaster
router.post("/ticketmaster", async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      page = 0,
      perPage = 6,
      isLoadMore = false,
    } = req.body;

    console.log(`[TM API] page=${page}, perPage=${perPage}, category="${category}", loadMore=${isLoadMore}`);

    const tmCfg = CATEGORY_MAP?.[category]?.ticketmaster;
    const hasTmKeywords = Array.isArray(tmCfg?.keywords) && tmCfg.keywords.length > 0;

    if (!hasTmKeywords && !isLoadMore) {
      return res.json({ events: [], hasMore: false, page });
    }

    try {
      const results = await getTicketmasterEvents({
        category: isLoadMore ? null : category, // keywords only on first call
        dateFrom: startDate,
        dateTo: endDate,
        page,
        perPage,
      });

      const events = Array.isArray(results) ? results : [];
      const hasMore = events.length === perPage;

      return res.json({
        events,
        hasMore,
        page: hasMore ? page + 1 : page,
      });
    } catch (err) {
      console.error(`[TM API] fetch failed: ${err.message}`);
      return res.json({ events: [], hasMore: false, page });
    }
  } catch (err) {
    console.error("ticketmaster api error:", err.message);
    res.status(500).json({ error: "failed to fetch ticketmaster events" });
  }
});

// Eventfinda
router.post("/eventfinda", async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      page = 0,
      perPage = 6,
      isLoadMore = false,
    } = req.body;

    console.log(`[EF API] page=${page}, perPage=${perPage}, category="${category}", loadMore=${isLoadMore}`);

    const efCfg = CATEGORY_MAP?.[category]?.eventfinda;
    const hasEfKeywords = Array.isArray(efCfg?.keywords) && efCfg.keywords.length > 0;

    if (!hasEfKeywords && !isLoadMore) {
      return res.json({ events: [], hasMore: false, page });
    }

    try {
      const results = await getEventfindaEvents({
        category: isLoadMore ? null : category, // keywords only on first call
        dateFrom: startDate,
        dateTo: endDate,
        page,
        perPage,
      });

      const events = Array.isArray(results) ? results : [];
      const hasMore = events.length === perPage;

      return res.json({
        events,
        hasMore,
        page: hasMore ? page + 1 : page,
      });
    } catch (err) {
      console.error(`[EF API] fetch failed: ${err.message}`);
      return res.json({ events: [], hasMore: false, page });
    }
  } catch (err) {
    console.error("eventfinda api error:", err.message);
    res.status(500).json({ error: "failed to fetch eventfinda events" });
  }
});

module.exports = router;
