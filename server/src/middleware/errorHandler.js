// handle requests for routes that do not exist
function notFound(req, res) {
  res.status(404).json({ error: "not found" });
}

// handle errors from anywhere in the app
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "server error";
  // only log errors in development
  if (process.env.NODE_ENV !== "production") {
    // console.error(err);
  }
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
