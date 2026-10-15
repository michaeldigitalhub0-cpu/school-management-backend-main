
const joi = require('joi');

exports.classSchema = joi.object({
    domain_name: joi.string().regex(/^junior$|^senior\sscience$|^senior\sart/),
    group_name: joi.string().regex(/^(JSS|SSS)\d{1}$/),
    arm_name: joi.string().regex(/^[A-G]{1}$/),
    form_teacher: joi.string().regex(/^(TCH)\d{6}$/)
});
