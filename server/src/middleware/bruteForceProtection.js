const ExpressBrute = require("express-brute");

// memory store to track failed attempts across requests
const store = new ExpressBrute.MemoryStore();

// custom failure callback that only counts server errors (5xx) as failures
// this prevents legitimate validation errors (4xx) from triggering brute force protection
const serverErrorOnly = (req, res, next, nextValidateRequest) => {
  // hook into the response to check the status code before counting as failure
  const originalEnd = res.end;
  const originalJson = res.json;
  
  let hasEnded = false;
  
  const checkAndCountFailure = () => {
    if (hasEnded) return;
    hasEnded = true;
    
    // only count 5xx server errors as failures, not 4xx client errors
    if (res.statusCode >= 500) {
      // check if nextValidateRequest is a function before calling
      if (typeof nextValidateRequest === 'function') {
        nextValidateRequest();
      }
    }
    // for 2xx, 3xx, 4xx - don't count as failure, reset the counter
    else if (req.brute && req.brute.reset) {
      req.brute.reset();
    }
  };
  
  res.end = function(...args) {
    checkAndCountFailure();
    return originalEnd.apply(this, args);
  };
  
  res.json = function(...args) {
    checkAndCountFailure();
    return originalJson.apply(this, args);
  };
  
  next();
};

// strict protection for ai generation endpoints due to high resource cost
const aiGenerationBruteForce = new ExpressBrute(store, {
  minWait: 2 * 1000, // start with 2 second delay
  maxWait: 15 * 60 * 1000, // maximum 15 minute delay
  freeRetries: 3, // allow 3 attempts before delays
  lifetime: 2 * 60 * 60, // track failures for 2 hours
  failureLimit: 10, // block after 10 failed attempts
  message: "too many ai generation requests. please wait before trying again.",
  failCallback: serverErrorOnly // only count server errors as failures
});

// general ip based protection for basic abuse prevention
const ipBruteForce = new ExpressBrute(store, {
  minWait: 500, // start with 500ms delay
  maxWait: 5 * 60 * 1000, // maximum 5 minute delay
  freeRetries: 15, // allow 15 attempts before delays
  lifetime: 30 * 60, // track failures for 30 minutes
  failureLimit: 30, // block after 30 failed attempts
  message: "too many requests from this ip address.",
  failCallback: serverErrorOnly // only count server errors as failures
});

module.exports = {
  aiGenerationBruteForce,
  ipBruteForce
};