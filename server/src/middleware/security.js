// use helmet for security headers
const helmet = require("helmet");
// use compression to make responses smaller
const compression = require("compression");

function security(app) {
  // set security headers for all requests
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // limit json body size to prevent abuse
  app.use(require("express").json({ limit: "100kb" }));
  // handle urlencoded form data
  app.use(require("express").urlencoded({ extended: false }));

  // compress responses to save bandwidth
  app.use(compression());
}

// export the security setup
module.exports = { security };
