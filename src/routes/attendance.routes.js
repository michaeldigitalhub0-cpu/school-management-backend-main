
const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { attendanceSchema } = require('../request_schemas/Attendance');
const { getAll, updateStudentAttendance, getStudentAttendanceStudent, saveAttendance, removeAttendance, getClassAttendanceAdmin, getClassAttendanceTeacher } = require('../services/attendance.service');

const router = require('express').Router();

router.get('/all', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getAll();
    console.log(data);
    res.status(200).json({ success: true, data });
});


router.get('/teacher', validateToken, roleCheck('teacher'), async (req, res) => {  //teacher-dashboard 

    const data = await getClassAttendanceTeacher(req.user.user_id);
    res.status(200).json({ success: true, data });
})

router.get('/student/me', validateToken, roleCheck('student'), async (req, res) => {  //student-dashboard -- a student can manually place another student id 

    const data = await getStudentAttendanceStudent(req.user.user_id);
    res.status(200).json({ success: true, data });
});

router.put('/update/:id', validateToken, validateSchema(attendanceSchema), roleCheck('teacher'), async (req, res) => {

    await updateStudentAttendance(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Successful, attendance record updated' });
});

router.get('/:class', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getClassAttendanceAdmin(req.params.class);
    res.status(200).json({ success: true, data });
});

router.post('/new', validateToken, roleCheck('teacher'), validateSchema(attendanceSchema), async (req, res) => {

    await saveAttendance(req.body);
    res.status(201).json({ success: true, message: 'Attendance saved for today' });
});

router.delete('/:id', validateToken, roleCheck('teacher'), async (req, res) => {

    await removeAttendance(req.params.id);
    res.status(201).json({ success: true, message: 'Attendance successfully deleted' });
});

module.exports = router;