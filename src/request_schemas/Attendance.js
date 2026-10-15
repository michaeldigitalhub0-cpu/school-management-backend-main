
const joi = require('joi');

exports.attendanceSchema = joi.object({
    form_teacher: joi.string().regex(/^(TCH)\d{6}$/).required(),
    class_domain: joi.string().regex(/^(CLD)\d{6}$/).required(),
    class_group: joi.string().regex(/^(CLG)\d{6}$/).required(),
    class_arm: joi.string().regex(/^(CLA)\d{6}$/).required(),
    attendance_record: joi.array().items(joi.object({
        student_id: joi.string().regex(/^(STU)\d{6}$/).required(),
        status: joi.string().regex(/^present$|^absent$/)
    })).required()
});

