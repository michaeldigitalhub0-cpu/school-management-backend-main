
const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { studentSchema } = require('../request_schemas/Student');
const { getAll, getByID, update, createStudent, remove } = require('../services/student.service');

const studentRoute = require('express').Router();

studentRoute.post('/new', validateToken, roleCheck('admin'), validateSchema(studentSchema), async (req, res) => {

    const data = await createStudent(req.body);
    res.status(201).json({ success: true, message: 'Successful, student added', data: {admission_no: data.admission_no, password: data.password}});
});

studentRoute.get('/admin/all', validateToken, roleCheck('admin'), async (req, res) => {

    const students = await getAll();
    res.status(200).json({ success: true, data: students });
});

// Only admin and teachers uses this route
studentRoute.get('/:id', validateToken, roleCheck('admin', 'teacher'), async (req, res) => {

    const student = await getByID(req.params.id);
    res.status(200).json({ success: true, data: student });
});

studentRoute.put('/:id', validateToken, roleCheck('admin'), validateSchema(studentSchema), async (req, res) => {

    await update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'updated' });
});

studentRoute.delete('/:id', validateToken, roleCheck('admin'), async (req, res) => {

    await remove(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
});

module.exports = studentRoute;