

const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { subjectSchema } = require('../request_schemas/Subject');
const { getAllSubjects, createSubject, getSubjectByID, updateSubjectData, removeSubject, getSubjectByClassGroup } = require('../services/subject.service');

router.post('/new', validateToken, roleCheck('admin'), validateSchema(subjectSchema), async (req, res) => {

    const data = await createSubject(req.body);
    res.status(200).json({ success: true, message: 'Successful, subject added' });
});

router.get('/all', validateToken, roleCheck('admin'), async (req, res) => {

    const data = await getAllSubjects();
    res.status(200).json({ success: true, data });
});

router.get('/group/:groupID', validateToken, roleCheck('teacher'), async (req, res) => {

    const data = await getSubjectByClassGroup(req.params.groupID);
    res.status(200).json({ success: true, data });
});

router.get('/:id', validateToken, roleCheck('admin', 'teacher'), async (req, res) => {

    const data = await getSubjectByID(req.params.id);
    res.status(200).json({ success: true, data });
});

router.put('/:id', validateToken, roleCheck('admin'), validateSchema(subjectSchema), async (req, res) => {

    await updateSubjectData(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Successful, subject updated' });
});

router.delete('/:id', validateToken, roleCheck('admin'), async (req, res) => {
    
    await removeSubject(req.params.id);
    res.status(200).json({ success: true, message: 'Successful, subject deleted' });
});

module.exports = router;