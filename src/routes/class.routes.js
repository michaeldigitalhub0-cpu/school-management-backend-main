
const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { classSchema } = require('../request_schemas/Class');
const { getAll,
    createClass,
    updateClassArm,
    getFormTeacherClass,
    removeDomain,
    removeGroup,
    removeArm, 
    getStudents} = require('../services/class.service');

router.post('/new', validateToken, roleCheck('admin'), validateSchema(classSchema), async (req, res) => {

    const newData = await createClass(req.body);
    res.status(201).json({ success: true, message: 'Successful, class created' });
});

router.get('/all', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getAll();
    res.status(200).json({ success: true, data });
});

router.get('/me', validateToken, roleCheck('teacher'), async (req, res) => {

    const data = await getFormTeacherClass(req.user.user_id);
    res.status(200).json({ success: true, data });
});

router.get('/:arm_id', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getStudents(req.params.arm_id);
    res.status(200).json({ success: true, data });
});

router.put('/update', validateToken, roleCheck('admin'), validateSchema(classSchema), async (req, res) => {

    const { domain_name, group_name, arm_name, form_teacher } = req.body;
    await updateClassArm(domain_name, group_name, arm_name, form_teacher);
    res.status(200).json({ success: true, message: 'Successful, class updated' });
});

router.delete('/domain/:id', validateToken, roleCheck('admin'), async (req, res) => {

    await removeDomain(req.params.id);
    res.status(200).json({ success: true, message: 'Successful, class domain deleted' });
});

router.delete('/group/:id', validateToken, roleCheck('admin'), async (req, res) => {

    await removeGroup(req.params.id);
    res.status(200).json({ success: true, message: 'Successful, class group deleted' });
});

router.delete('/arm/:id', validateToken, roleCheck('admin'), async (req, res) => {

    await removeArm(req.params.id);
    res.status(200).json({ success: true, message: 'Successful, class arm deleted' });
});
module.exports = router;
