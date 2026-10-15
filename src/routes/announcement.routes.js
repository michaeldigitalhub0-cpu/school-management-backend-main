
const router = require('express').Router();

const { validateToken } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { validateSchema } = require('../middleware/validate');
const { announcementSchemaAdmin, announcementSchemaTeacher } = require('../request_schemas/Announcement');
const {
    createAnouncement,
    getAnnouncementAdmin,
    getAnnouncementTeacher,
    getAnnouncementStudent,
    updateAnnouncement,
    removeAnnouncement
} = require('../services/announcement.service');

router.post(
    '/admin/new',
    validateToken,
    roleCheck('admin'),
    validateSchema(announcementSchemaAdmin),
    async (req, res) => {
        await createAnouncement(req.user.user_id, req.body);
        res.status(201).json({ success: true, message: 'posted' });
    }
);

router.post(
    '/teacher/new',
    validateToken,
    roleCheck('teacher'),
    validateSchema(announcementSchemaTeacher),
    async (req, res) => {
        await createAnouncement(req.user.user_id, req.body);
        res.status(201).json({ success: true, message: 'posted' });
    }
);

router.get('/admin/all', validateToken, roleCheck('admin'), async (req, res) => {

    const {limit} = req.query;
    const data = await getAnnouncementAdmin(limit);
    res.status(200).json({ success: true, data });
});

router.get('/teacher/all', validateToken, roleCheck('teacher'), async (req, res) => {
    
    const {limit} = req.query;
    const data = await getAnnouncementTeacher(req.user.user_id, limit);
    res.status(200).json({ success: true, data });
});

router.get('/student/all', validateToken, roleCheck('student'), async (req, res) => {
    const {limit} = req.query;
    const data = await getAnnouncementStudent(req.user.user_id, limit);
    res.status(200).json({ success: true, data });
});

router.put(
    '/admin/:id',
    validateToken,
    roleCheck('admin'),
    validateSchema(announcementSchemaAdmin),
    async (req, res) => {

        await updateAnnouncement(req.params.id, req.user.user_id, req.body);
        res.status(200).json({ success: true, message: 'Updated' });
    }
);

router.put(
    '/teacher/:id',
    validateToken,
    roleCheck('teacher'),
    validateSchema(announcementSchemaTeacher),
    async (req, res) => {

        await updateAnnouncement(req.params.id, req.user.user_id, req.body);
        res.status(200).json({ success: true, message: 'Updated' });
    }
);

router.delete('/:id', validateToken, roleCheck('admin', 'teacher'), async (req, res) => {

    await removeAnnouncement(req.params.id, req.user.user_id);
    res.status(200).json({ success: true, message: 'Deleted' });
});

module.exports = router;