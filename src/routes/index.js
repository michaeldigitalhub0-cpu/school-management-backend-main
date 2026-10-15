
const router = require('express').Router();

const authRoutes = require('./auth.routes');
const teacherRoutes = require('./teacher.routes');
const studentRoutes = require('./student.routes');
const classRoutes = require('./class.routes');
const subjectRoutes = require('./subject.routes');
const attendanceRoutes = require('./attendance.routes');
const timetableRoutes = require('./timetable.routes');
const gradeRoutes = require('./grade.routes');
const announcementRoutes = require('./announcement.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/class', classRoutes);
router.use('/subject', subjectRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetable', timetableRoutes);
router.use('/grade', gradeRoutes);
router.use('/announcement', announcementRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

