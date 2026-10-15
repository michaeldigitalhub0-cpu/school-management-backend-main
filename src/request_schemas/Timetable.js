
const joi = require('joi');

const daySlot = joi.object({
    subject_id: joi.string().regex(/^SUB\d{6}$/).required()
});

exports.timetableSchema = joi.object({
    class_domain: joi.string().regex(/^CLD\d{6}$/).required(),
    class_group: joi.string().regex(/^CLG\d{6}$/).required(),
    class_arm: joi.string().regex(/^CLA\d{6}$/).required(),
    period: joi.array().items(
        joi.object({
            time: joi.string().regex(/^\d{2}:\d{2}\-\d{2}:\d{2}?$/).required(),
            monday: daySlot,
            tuesday: daySlot,
            wednesday: daySlot,
            thursday: daySlot,
            friday: daySlot
        })
    ).min(1).required()
});