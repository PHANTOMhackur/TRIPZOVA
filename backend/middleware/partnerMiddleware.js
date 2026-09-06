/* =========================================================
   TRIPZOVA PARTNER MIDDLEWARE

   Must run AFTER authMiddleware (req.user must exist).
   Blocks any logged-in user whose role is not "partner"
   from reaching partner-only API routes, regardless of
   what URL/page they were sent from on the frontend.
========================================================= */

function partnerMiddleware(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required."
        });
    }

    if (req.user.role !== "partner") {
        return res.status(403).json({
            message: "Partner access required."
        });
    }

    next();
}

module.exports = partnerMiddleware;
