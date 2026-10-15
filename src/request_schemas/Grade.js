
const joi = require('joi');

// | Field          | Type         | Null | Key | Default | Extra |
// +----------------+--------------+------+-----+---------+-------+
// | grade_id       | char(9)      | NO   | PRI | NULL    |       |
// | student_id     | char(9)      | NO   | MUL | NULL    |       |
// | assignment_id  | char(9)      | NO   | MUL | NULL    |       |
// | school_session | char(9)      | NO   |     | NULL    |       |
// | term           | varchar(15)  | NO   |     | NULL    |       |
// | firstCA        | decimal(4,1) | YES  |     | 0.0     |       |
// | secondCA       | decimal(4,1) | YES  |     | 0.0     |       |
// | exam           | decimal(4,1) | YES  |     | 0.0     |       |
// +----------------+--------------+------+-----+---------+-------+

exports.gradeSchema = joi.object({
    student_id: joi.string().regex(/^(STU)\d{6}$/).required(),
    subject_id: joi.string().regex(/^(SUB)\d{6}$/).required(),
    term: joi.string().regex(/^first$|^second$|^third$/).required(),
    firstCA: joi.number().max(20.0),
    secondCA: joi.number().max(20.0),
    exam: joi.number().max(60.0),
});
