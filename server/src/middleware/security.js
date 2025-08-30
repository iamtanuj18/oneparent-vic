const helmet = require("helmet");
const compression = require("compression");

function security(app) {
  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // JSON body limit (prevent abuse)
  app.use(require("express").json({ limit: "100kb" }));
  app.use(require("express").urlencoded({ extended: false }));

  // Gzip
  app.use(compression());
}

module.exports = { security };
