const { ValidationErrorHandler } = require("./errorHandler")

module.exports = (...validRoles) => {
    return (req, res, next) => {
        if (!validRoles.includes(req.user.user_role)) {
            next(new ValidationErrorHandler('forbidden', 403));
            return;
        }
        next();
    };
}