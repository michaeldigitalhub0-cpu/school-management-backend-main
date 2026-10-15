
const joi = require('joi');

exports.loginSchema = joi.object({
    user_id: joi.string().regex(/(ADM|STU|TCH)\d{6}$/).length(9).required(),
    user_role: joi.string().valid('admin', 'teacher', 'student').required(),
    user_password: joi.string().length(8).required()
});