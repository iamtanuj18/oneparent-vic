const { CONFIG } = require("../config");

// handle requests for routes that do not exist
function notFound(req, res) {
  console.log(`[404] ${req.method} ${req.path} from ${req.ip}`);
  res.status(404).json({ 
    error: "not found",
    path: req.path,
    method: req.method
  });
}

// centralized error handler for all application errors
function errorHandler(err, req, res, _next) {
  // determine appropriate status code
  const status = err.status || err.statusCode || 500;
  
  // handle specific error types
  let message = err.message || "server error";
  if (err.code === "NO_KEY") {
    message = "server configuration error";
  }
  
  // log error details for debugging
  console.error(`[${status}] ${req.method} ${req.path}:`, {
    error: message,
    stack: CONFIG.NODE_ENV !== "production" ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString()
  });
  
  // build response object
  const response = {
    error: message,
    status: status
  };
  
  // include stack trace only in development
  if (CONFIG.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  
  res.status(status).json(response);
}

module.exports = { notFound, errorHandler };
