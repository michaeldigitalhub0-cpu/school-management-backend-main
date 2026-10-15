
const joi = require('joi');

exports.announcementSchemaAdmin = joi.object({
    title: joi.string().max(100).required(),
    body: joi.string().max(500).required(),
    audience: joi.string().regex(/^all$|^teachers$/)
});

exports.announcementSchemaTeacher = joi.object({
    title: joi.string().max(100).required(),
    body: joi.string().max(500).required(),
    audience: joi.string().regex(/^students$/) // of that perticular class
});