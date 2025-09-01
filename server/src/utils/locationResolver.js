
function resolveLocation(provider) {
  if (provider === "ticketmaster") {
    return {
      countryCode: "AU",
      stateCode: "VIC",
    };
  }

  return {};
}

module.exports = { resolveLocation };
