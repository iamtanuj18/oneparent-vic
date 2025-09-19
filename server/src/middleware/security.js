const helmet = require("helmet");
const compression = require("compression");

// apply essential security headers for json api
function security(app) {
  try {
    // basic security headers without csp (not needed for json api)
    app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // disable csp for json api
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    }));

    // compress responses to save bandwidth
    app.use(compression({
      level: 6,
      threshold: 1024 // only compress responses larger than 1kb
    }));
  } catch (error) {
    console.error("[security] failed to initialize security middleware:", error);
    throw error;
  }
}

module.exports = { security };
