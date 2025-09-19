// use express for routing
const express = require("express");
const router = express.Router();
// import event services and category map
const { getEventfindaEvents } = require("../services/eventfindaService.js");
const { getTicketmasterEvents } = require("../services/ticketmasterService.js");
const CATEGORY_MAP = require("../utils/categoryMapping");

// get events from ticketmaster
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

  // console.log(`[TM API] page=${page}, perPage=${perPage}, category="${category}", loadMore=${isLoadMore}`);

    const tmCfg = CATEGORY_MAP?.[category]?.ticketmaster;
    const hasTmKeywords = Array.isArray(tmCfg?.keywords) && tmCfg.keywords.length > 0;

    // if no keywords and not loading more, return empty
    if (!hasTmKeywords && !isLoadMore) {
      return res.json({ events: [], hasMore: false, page });
    }

    try {
      // fetch events from ticketmaster
      const results = await getTicketmasterEvents({
        category: isLoadMore ? null : category, // keywords only on first call
        dateFrom: startDate,
        dateTo: endDate,
        page,
        perPage,
      });

  // check if there are more events to load
  const events = Array.isArray(results) ? results : [];
  const hasMore = events.length === perPage;

      // send events and paging info
      return res.json({
        events,
        hasMore,
        page: hasMore ? page + 1 : page,
      });
    } catch (err) {
      // failed to fetch events from ticketmaster
      return res.json({ events: [], hasMore: false, page });
    }
  } catch (err) {
    // ticketmaster api error
    res.status(500).json({ error: "failed to fetch ticketmaster events" });
  }
});

// get events from eventfinda
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

  // console.log(`[EF API] page=${page}, perPage=${perPage}, category="${category}", loadMore=${isLoadMore}`);

    const efCfg = CATEGORY_MAP?.[category]?.eventfinda;
    const hasEfKeywords = Array.isArray(efCfg?.keywords) && efCfg.keywords.length > 0;

    // if no keywords and not loading more, return empty
    if (!hasEfKeywords && !isLoadMore) {
      return res.json({ events: [], hasMore: false, page });
    }

    try {
      // fetch events from eventfinda
      const results = await getEventfindaEvents({
        category: isLoadMore ? null : category, // keywords only on first call
        dateFrom: startDate,
        dateTo: endDate,
        page,
        perPage,
      });

  // check if there are more events to load
  const events = Array.isArray(results) ? results : [];
  const hasMore = events.length === perPage;

      // send events and paging info
      return res.json({
        events,
        hasMore,
        page: hasMore ? page + 1 : page,
      });
    } catch (err) {
      // failed to fetch events from eventfinda
      return res.json({ events: [], hasMore: false, page });
    }
  } catch (err) {
    // eventfinda api error
    res.status(500).json({ error: "failed to fetch eventfinda events" });
  }
});

// export the router
module.exports = router;
