
class ErrorHandler extends Error {
    constructor(message = 'Internal server error', statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

class ValidationErrorHandler extends ErrorHandler {
    constructor(message = 'Invalid credentals', statusCode = 403) {
        super(message, statusCode)
    }
}

class NotFoundError extends ErrorHandler {
    constructor(message = 'Not found', statusCode = 404) {
        super(message, statusCode);
    }
}

const mysqlErrors = {
    ER_DUP_ENTRY: [409, 'Record already exists'],
    ER_NO_REFERENCED_ROW_2: [400, 'Referenced record does not exist'],
    ER_ROW_IS_REFERENCED_2: [409, 'Record is still in use'],
    ER_BAD_NULL_ERROR: [400, 'Missing required field'],
    ER_DATA_TOO_LONG: [400, 'Value too long'],
    ER_TRUNCATED_WRONG_VALUE: [400, 'Invalid value'],
    ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Value not allowed']
};

const AppError = (error, request, response, next) => {
    const mapped = mysqlErrors[error.code];

    const status = error.statusCode || (mapped && mapped[0]) || 500;
    const message = error.statusCode
        ? error.message
        : mapped ? mapped[1] : 'Internal server error';

    if (status === 500) console.log(error.message);

    response.status(status).json({ success: false, message });
};

module.exports = { ErrorHandler, ValidationErrorHandler, NotFoundError, AppError };
