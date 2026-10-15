
const joi = require('joi');

exports.subjectSchema = joi.object({
    subject_name: joi.string().required(),
    group_id: joi.string().regex(/^(CLG)\d{6}$/).required()
});

