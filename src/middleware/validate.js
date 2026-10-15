
const { ValidationErrorHandler } = require('./errorHandler');

const validateSchema = (schema) => async (req, res, next) => {
    try {
        await schema.validateAsync(req.body);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.log(error);
        return next(new ValidationErrorHandler(error.details[0].message, 400));
    }
    next();
};

module.exports = { validateSchema };
