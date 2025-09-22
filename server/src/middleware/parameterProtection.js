const hpp = require("hpp");

// prevent http parameter pollution attacks
function parameterProtection() {
  return hpp({
    // allow these query parameters to have multiple values if needed
    whitelist: [
      "q" // suburb search query parameter
    ]
  });
}

module.exports = { parameterProtection };