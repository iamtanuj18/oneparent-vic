
// import main modules
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { CONFIG } = require("./config");
const { security } = require("./middleware/security");
const { generalLimiter, speedLimiter } = require("./middleware/rateLimit");
const { xssProtection } = require("./middleware/xssProtection");
const { parameterProtection } = require("./middleware/parameterProtection");
const { ipBruteForce } = require("./middleware/bruteForceProtection");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { ping, close } = require("./db");

// import route handlers
const apiHealthCheck = require("./routes/apiHealthCheck");
const insights = require("./routes/insights");
const events = require("./routes/events");
const playdate = require("./routes/playdate");
const victoriaSuburbList = require("./routes/victoriaSuburbList");
const communityMatch = require("./routes/communityMatch");
const journeyMap = require("./routes/journeyMap");

const app = express();

// trust proxy for accurate ip detection behind load balancers
app.set("trust proxy", 1);

// set security headers first
security(app);

// parse json body with size limit to prevent abuse
app.use(express.json({ 
  limit: "100kb",
  strict: true,
  type: "application/json"
}));

// parse form data with size limit
app.use(express.urlencoded({ 
  extended: false,
  limit: "100kb",
  parameterLimit: 20
}));

// protect against parameter pollution attacks
app.use(parameterProtection());

// protect against xss attacks by sanitizing input
app.use(xssProtection);

// protect against brute force attacks by ip
app.use(ipBruteForce.prevent);

// log all requests after security measures
app.use(morgan("combined"));

// set up cors for allowed origins
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

// add progressive slowdown for too many requests
app.use(speedLimiter);

// apply general rate limiting to all routes
app.use(generalLimiter);

// connect main routes with proper middleware order
app.use("/api", apiHealthCheck);
app.use("/api", events);
app.use("/api", playdate);
app.use("/api", victoriaSuburbList);
app.use("/api", insights);
app.use("/api/community-match", communityMatch);
app.use("/api/journey-map", journeyMap);

// handle not found and errors
app.use(notFound);
app.use(errorHandler);

// start the server
const server = app.listen(CONFIG.PORT, async () => {
  console.log(`[server] ${CONFIG.API_ENV} listening on :${CONFIG.PORT}`);
  const ok = await ping();
  console.log(ok ? "[db] connected" : "[db] not available");
});

// shutdown the server gracefully
async function shutdown(signal) {
  console.log(`[server] ${signal} received, shutting down...`);
  await close();
  server.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

