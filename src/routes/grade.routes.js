
const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { gradeSchema } = require('../request_schemas/Grade');
const { saveStudentGrade, getGrades, updateGrade, removeGrade } = require('../services/grade.service');

router.post('/new', validateToken, roleCheck('teacher'), validateSchema(gradeSchema), async (req, res) => {

    await saveStudentGrade(req.body);
    res.status(201).json({ success: true, message: 'Successful, record saved' });
});

router.get('/all', validateToken, roleCheck('student', 'admin', 'teacher'), async (req, res) => {

    const data = await getGrades(req.user.user_id);
    res.status(200).json({ success: true, data });
});

router.put('/:id', validateToken, roleCheck('teacher'), validateSchema(gradeSchema), async (req, res) => {

    await updateGrade(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Successful, record updated' });
});

router.delete('/:id', validateToken, roleCheck('teacher'), async (req, res) => {

    await removeGrade(req.params.id);
    res.status(200).json({ success: true, message: 'Successful, record deleted' });
});

module.exports = router;