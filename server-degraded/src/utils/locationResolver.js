// resolve location info for different providers
function resolveLocation(provider) {
  if (provider === "ticketmaster") {
    // ticketmaster needs country and state codes
    return {
      countryCode: "AU",
      stateCode: "VIC",
    };
  }

  if (provider === "eventfinda") {
    // eventfinda needs city, region, and country
    return {
      city: "Melbourne",
      region: "Victoria",
      country: "Australia"
    };
  }

  // fallback for unknown provider
  return {};
}

// export the resolver
module.exports = { resolveLocation };
