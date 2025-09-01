const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { CONFIG } = require("./config");
const { security } = require("./middleware/security");
const { limiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

// Routes
const health = require("./routes/health");
const insights = require("./routes/insights");
const events = require("./routes/events");
const playdate = require("./routes/playdate");
const benefits = require("./routes/benefits");
const childcare = require("./routes/childcare");
const wellbeing = require("./routes/wellbeing");
const transition = require("./routes/transition");

const app = express();

// Security + compression + body limits
security(app);

// Logging (dev-friendly)
app.use(morgan(CONFIG.NODE_ENV === "production" ? "combined" : "dev"));

// CORS (only allow listed origins)
const allowed = CONFIG.CORS_ORIGINS;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl/postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"), false);
  },
  credentials: false
}));

// Rate limiting
app.use(limiter);

// Mount routes
app.use(health);
// app.use(insights);
app.use(events);
// app.use(playdate);
// app.use(benefits);
// app.use(childcare);
// app.use(wellbeing);
// app.use(transition);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

app.listen(CONFIG.PORT, () => {
  console.log(`[server] ${CONFIG.NODE_ENV} listening on :${CONFIG.PORT}`);
});
