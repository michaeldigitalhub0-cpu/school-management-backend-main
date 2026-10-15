
const joi = require('joi');

exports.studentSchema = joi.object({
    fName: joi.string().max(15).required(),
    lName: joi.string().max(15).required(),
    mName: joi.string().max(15),
    dob: joi.string().regex(/(^\d{4})-(\d{2})-(\d{2})$/).required(),
    gender: joi.string().regex(/^M$|^F$/).required(),
    contact: joi.string().regex(/^\d{11}$/).required(),
    guardian_fName: joi.string().max(15).required(),
    guardian_lName: joi.string().max(15).required(),
    guardian_mName: joi.string().max(15),
    guardian_contact: joi.string().regex(/^\d{11}$/).required(),
    class_domain: joi.string().regex(/^(CLD)\d{6}$/).length(9).required(),
    class_group: joi.string().regex(/^(CLG)\d{6}$/).length(9).required(),
    class_arm: joi.string().regex(/^(CLA)\d{6}$/).length(9).required()
});
