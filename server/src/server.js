// server/src/server.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { CONFIG } = require("./config");
const { security } = require("./middleware/security");
const { limiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { ping, close } = require("./db");

// Routes
const health = require("./routes/health");
const insights = require("./routes/insights");
const events = require("./routes/events");
const playdate = require("./routes/playdate");
const benefits = require("./routes/benefits");
const childcare = require("./routes/childcare");
const wellbeing = require("./routes/wellbeing");
const transition = require("./routes/transition");
const address = require("./routes/address");

const app = express();

// security, compression, body limits
security(app);

// logging
app.use(morgan("combined"));

// CORS
const allowed = CONFIG.CORS_ORIGINS;
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"), false);
    },
    credentials: false,
  })
);

// rate limiting
app.use(limiter);

// routes
app.use(health);
app.use(events);
app.use(playdate);
app.use(address);
// app.use(insights);
// app.use(benefits);
// app.use(childcare);
// app.use(wellbeing);
// app.use(transition);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

// start
const server = app.listen(CONFIG.PORT, async () => {
  console.log(`[server] ${CONFIG.NODE_ENV} listening on :${CONFIG.PORT}`);
  const ok = await ping();
  console.log(ok ? "[db] connected" : "[db] not available");
});

//  shutdown
async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`);
  await close();
  server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

