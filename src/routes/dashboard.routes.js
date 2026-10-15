
const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getAllTeachers, getAllStudents, getAllCLasses, getCurrentAttendance, getRecentAnnouncement } = require('../services/dashboard_services/admin');
const { getMyDetailsStudent, getTimeTableStudent, getCurrentAttendanceStudent, getOverallAttendance } = require('../services/dashboard_services/student');
const { getMyDetailsTeacher, getTimeTable, getClassTimeTable, getCurrentAttendanceTeacher, getClassStudents } = require('../services/dashboard_services/teacher');

//====================== Teacher Dashboard ============================
router.get('/teacher/me', validateToken, roleCheck('teacher'), async (req, res)=>{

    const data = await getMyDetailsTeacher(req.user.user_id);
    res.status(200).json({success: true, data});
});

router.get('/teacher/timetable/me', validateToken, roleCheck('teacher'), async (req, res)=>{

    const data = await getTimeTable(req.user.user_id);
    res.status(200).json({success: true, data});
});

router.get('/teacher/timetable/:arm_id', validateToken, roleCheck('teacher'), async (req, res)=>{

    const data = await getClassTimeTable(req.params.arm_id);
    res.status(200).json({success: true, data});
});

router.get('/teacher/attendance/today', validateToken, roleCheck('teacher'), async (req, res)=>{

    const data = await getCurrentAttendanceTeacher(req.user.user_id);
    res.status(200).json({success: true, data});
});

router.get('/teacher/students', validateToken, roleCheck('teacher'), async (req, res)=>{

    const data = await getClassStudents(req.user.user_id);
    res.status(200).json({success: true, data});
});

// ========================== Student dashboard ========================
router.get('/student/me', validateToken, roleCheck('student'), async (req, res)=>{

    const data = await getMyDetailsStudent(req.user.user_id);
    res.status(200).json({success: true, data});
});

router.get('/student/timetable/:arm_id', validateToken, roleCheck('student'), async (req, res)=>{

    const data = await getTimeTableStudent(req.params.arm_id);
    res.status(200).json({success: true, data});
});

router.get('/student/today/:arm_id', validateToken, roleCheck('student'), async (req, res)=>{

    const data = await getCurrentAttendanceStudent(req.params.arm_id, req.user.user_id);
    res.status(200).json({success: true, data});
});

router.get('/student/overall/:arm_id', validateToken, roleCheck('student'), async (req, res)=>{

    const data = await getOverallAttendance(req.params.arm_id, req.user.user_id);
    res.status(200).json({success: true, data});
});

// ==================== Admin =====================================

router.get('/admin/teachers', validateToken, roleCheck('admin'), async (req, res)=>{

    const data = await getAllTeachers();
    res.status(200).json({success: true, data});
});

router.get('/admin/students', validateToken, roleCheck('admin'), async (req, res)=>{

    const data = await getAllStudents();
    res.status(200).json({success: true, data});
});

router.get('/admin/classes', validateToken, roleCheck('admin'), async (req, res)=>{

    const data = await getAllCLasses();
    res.status(200).json({success: true, data});
});

router.get('/admin/attendance', validateToken, roleCheck('admin'), async (req, res)=>{

    const data = await getCurrentAttendance();
    res.status(200).json({success: true, data});
});

router.get('/admin/announcement/recent', validateToken, roleCheck('admin'), async (req, res)=>{

    const data = await getRecentAnnouncement();
    res.status(200).json({success: true, data});
});

module.exports = router;