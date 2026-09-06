/* =========================================================
   TRIPZOVA - NOSQL INJECTION GUARD

   Strips any object key that starts with "$" or contains
   a "." from user-supplied input, e.g. blocking payloads
   like:
       { "email": { "$ne": null }, "password": { "$ne": null } }
   which could otherwise bypass a Mongoose .findOne() check.

   Express 5 made req.query and req.params getter-only, so
   (unlike older Express-4-era sanitizer packages) this only
   mutates objects IN PLACE - it never reassigns req.query,
   req.params or req.body themselves.
========================================================= */

function isPlainObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function sanitizeInPlace(target) {

    if (Array.isArray(target)) {
        target.forEach(sanitizeInPlace);
        return;
    }

    if (!isPlainObject(target)) {
        return;
    }

    for (const key of Object.keys(target)) {

        if (key.startsWith("$") || key.includes(".")) {
            delete target[key];
            continue;
        }

        sanitizeInPlace(target[key]);
    }
}

function sanitizeInput(req, res, next) {

    if (req.body) {
        sanitizeInPlace(req.body);
    }

    // req.query / req.params are read-only container
    // references in Express 5, but their contents can
    // still be edited in place safely.
    if (req.query) {
        sanitizeInPlace(req.query);
    }

    if (req.params) {
        sanitizeInPlace(req.params);
    }

    next();
}

module.exports = sanitizeInput;
