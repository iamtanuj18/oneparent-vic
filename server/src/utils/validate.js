// import zod for schema validation
const { z } = require("zod");

// validate request using zod schema
function validate(schema) {
  return (req, res, next) => {
    const toCheck = { body: req.body, query: req.query, params: req.params };
    const result = schema.safeParse(toCheck);
    // if validation fails, send error
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
      const err = new Error(`validation error: ${issues.join("; ")}`);
      err.status = 400;
      return next(err);
    }
    // attach validated data to request
    req.valid = result.data;
    next();
  };
}

// export validate and zod
module.exports = { validate, z };
