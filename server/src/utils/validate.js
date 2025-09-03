const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const toCheck = { body: req.body, query: req.query, params: req.params };
    const result = schema.safeParse(toCheck);
    if (!result.success) {
      const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
      const err = new Error(`Validation error: ${issues.join("; ")}`);
      err.status = 400;
      return next(err);
    }
    req.valid = result.data;
    next();
  };
}

module.exports = { validate, z };
