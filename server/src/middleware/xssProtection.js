// basic input sanitization for json api
function xssProtection(req, res, next) {
  try {
    // sanitize request body if it exists
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }
    
    // sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query);
    }
    
    // sanitize route parameters
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error("[xss] sanitization failed:", error);
    // continue with unsanitized data rather than block request
    next();
  }
}

// recursively sanitize object properties for json api
function sanitizeObject(obj) {
  // handle null or non-object values
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  
  // handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === "string") {
        return sanitizeString(item);
      } else if (typeof item === "object" && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === "string") {
        // sanitize string values for json api
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        // handle arrays recursively
        sanitized[key] = sanitizeObject(value);
      } else if (typeof value === "object" && value !== null) {
        // recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value);
      } else {
        // keep non string values as they are
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// basic string sanitization for json api inputs
function sanitizeString(str) {
  if (typeof str !== "string") return str;
  
  return str
    // remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // remove basic html tags for json api
    .replace(/<[^>]*>/g, "")
    // normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// export the xss protection middleware
module.exports = { xssProtection };