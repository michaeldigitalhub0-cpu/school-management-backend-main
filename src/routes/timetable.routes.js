// routes/timetable.routes.js

const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { timetableSchema } = require('../request_schemas/Timetable');
const { createTimeTable, updateTimeTable, removeTimeTable, getMyTimetableTodayTeacher, getMyTimetableTodayStudent } = require('../services/timetable.service');
const { getTimetableByArm, getMyTimetableToday } = require('../services/timetable.service');


router.post('/new', validateToken, roleCheck('admin'), validateSchema(timetableSchema), async (req, res) => {

    const data = await createTimeTable(req.body);
    res.status(201).json({ success: true, message: 'Successful, record saved' });
});

router.get('/:id', validateToken, roleCheck('admin', 'teacher'), async (req, res) => {
    const data = await getTimetableByArm(req.params.id);
    res.status(200).json({ success: true, data });
});

router.get('/teacher/me/today', validateToken, roleCheck('teacher'), async (req, res) => {
    const data = await getMyTimetableTodayTeacher(req.user.user_id);
    res.status(200).json({ success: true, data });
});

router.get('/student/me/today', validateToken, roleCheck('student'), async (req, res) => {
    const data = await getMyTimetableTodayStudent(req.user.user_id);
    res.status(200).json({ success: true, data });
});

router.put('/update', validateToken, roleCheck('admin'), validateSchema(timetableSchema), async (req, res) => {
    const data = await updateTimeTable(req.body);
    res.status(200).json({ success: true, message: 'Successful, record updated' });
});

router.delete('/:armID', validateToken, roleCheck('admin'), async (req, res) => {
    await removeTimeTable(req.params.armID);
    res.status(200).json({ success: true, message: 'Successful, record deleted' });
});
module.exports = router;