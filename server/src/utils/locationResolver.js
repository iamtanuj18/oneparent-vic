// src/utils/locationResolver.js
function resolveLocation(provider) {
  if (provider === "ticketmaster") {
    return {
      countryCode: "AU",
      stateCode: "VIC",
    };
  }

  if (provider === "eventfinda") {
    return {
      city: "Melbourne",
      region: "Victoria",
      country: "Australia"
    };
  }

  return {};
}

module.exports = { resolveLocation };
