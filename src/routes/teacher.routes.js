
const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { teacherSchema } = require('../request_schemas/Teacher');
const { createTeacher, getAllTeachers, getTeacherByID, updateTeacher, removeTeacher } = require('../services/teacher.service');

router.post('/new', validateToken, roleCheck('admin'), validateSchema(teacherSchema), async (req, res) => {

    const newTeacherData = await createTeacher(req.body);
    res.status(201).json({ 
        success: true, 
        message: 'Successful, teacher created',
        data: {staff_id: newTeacherData.staff_id, password: newTeacherData.password} });
});

router.get('/all', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getAllTeachers();
    res.status(200).json({ success: true, data });
});

router.get('/:id', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getTeacherByID(req.params.id);
    res.status(200).json({ success: true, data });
});

router.put('/:id', validateToken, roleCheck('admin'), validateSchema(teacherSchema), async (req, res) => {

    await updateTeacher(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Updated' });
});

router.delete('/:id', validateToken, roleCheck('admin'), async (req, res) => {

    await removeTeacher(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
});

module.exports = router;