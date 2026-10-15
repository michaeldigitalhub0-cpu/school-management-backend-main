
const connectionPool = require('../config/database');
const { NotFoundError, ValidationErrorHandler } = require('../middleware/errorHandler');
const { getCurrentDay } = require('../utils/dateUtils');
const { generateID } = require('../utils/idGenerator');

const createAnouncement = async (user_id, announcement) => {

    const { title, body, audience } = announcement;
    const connection = await connectionPool.getConnection();

    try {

        await connection.beginTransaction();
        const announcement_id = await generateID('announcement', connection);

        await connection.execute(`
                INSERT INTO announcement VALUES
                (?, ?, ?, ?, ?, ?)
            `, [announcement_id, title, body, audience, user_id, getCurrentDay()]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const getAnnouncementAdmin = async (limit) => {

    const [data] = await connectionPool.execute(`
        SELECT 
            ann.announcement_id,
            ann.title,
            ann.body,
            ann.audience,
            usr.lName,
            usr.fName,
            usr.mName,
            usr.user_role,
            ann.date_posted
        FROM announcement ann
        JOIN users usr
        ON usr.user_id = ann.posted_by
        LIMIT ?;
    `, [10]);

    return data;
}

const getAnnouncementTeacher = async (teacher_id, limit) => {
console.log(typeof limit)

    const [data] = await connectionPool.execute(`
        SELECT 
           ann.announcement_id,
            ann.title,
            ann.body,
            ann.audience,
            usr.lName,
            usr.fName,
            usr.mName,
            usr.user_role,
            ann.date_posted
        FROM announcement ann
        JOIN users usr
        ON usr.user_id = ann.posted_by
        WHERE ann.audience = 'teachers' OR audience = 'all' OR posted_by = ? 
        LIMIT ?;
    `, [teacher_id, Number(limit)]);

    return data;
}

const getAnnouncementStudent = async (student_id, limit) => {   // only for the perticular class (posted by the form teacher)

    const [form_teacher] = await connectionPool.execute(`
        SELECT 
            form_teacher 
        FROM class_arm ca
        JOIN student_class sc
        ON ca.arm_id = sc.arm_id
        WHERE sc.admission_no = ?
    `, [student_id]);

    if(!form_teacher[0]) throw new NotFoundError('No announcement from your form  teacher yet');
    
    const [data] = await connectionPool.execute(`
        SELECT
            ann.announcement_id,
            ann.title,
            ann.body,
            ann.audience,
            usr.lName,
            usr.fName,
            usr.mName,
            usr.user_role,
            ann.date_posted
        FROM announcement ann
        JOIN users usr
        ON usr.user_id = ann.posted_by
        WHERE audience = 'students' AND posted_by = ? OR audience = 'all' LIMIT ?;
    `, [form_teacher[0].form_teacher, Number(limit)]);

    return data;
}

const updateAnnouncement = async (id, user_id, update) => {  // getting the user id from the token
    
    if(!id) throw new ValidationErrorHandler('ID not provided', 400);

    const { title, body, audience } = update;

    if(!id) throw new ValidationErrorHandler('Announcement ID not provided', 400);
    if (/^(ADM)s?\d{6}$/.test(user_id)) {

        await connectionPool.execute(`
            UPDATE announcement
            SET 
                title = ?,
                body = ?,
                audience = ?,
                date_posted = ?
            WHERE announcement_id = ?
        `, [title, body, audience, getCurrentDay(), id]
        );
        return;
    }

    await connectionPool.execute(`
        UPDATE announcement
        SET 
            title = ?,
            body = ?,
            audience = ?,
            date_posted = ?
        WHERE announcement_id = ? AND posted_by = ?
    `, [title, body, audience, getCurrentDay(), id, user_id]);
}

const removeAnnouncement = async (id, user_id) => {

    if(!id) throw new ValidationErrorHandler('Announcement ID not provided', 400);

    if (/^(ADM)s?\d{6}$/.test(user_id)) {

        await connectionPool.execute(`
            DELETE FROM announcement 
            WHERE announcement_id = ?
        `, [id, user_id]
        );
        return;
    }

    await connectionPool.execute(`
        DELETE FROM announcement 
        WHERE announcement_id = ?
        AND posted_by = ?
    `, [id, user_id]);
}

module.exports = {
    createAnouncement,
    getAnnouncementAdmin,
    getAnnouncementTeacher,
    getAnnouncementStudent,
    updateAnnouncement,
    removeAnnouncement
};