const bcrypt = require('bcryptjs');
const connectionPool = require('../config/database');
const { NotFoundError, ValidationErrorHandler, ErrorHandler } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');
const { generateUserPassword } = require('../utils/passwordGenerator');
const { getCurrentDay } = require('../utils/dateUtils');

const createTeacher = async (teacherData) => {
    const {
        fName, lName, mName, dob, gender, contact,
        class_domain, class_group, class_arm, subject_id
    } = teacherData;

    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const staff_id = await generateID('teacher', connection);
        const password = generateUserPassword();
        const password_hash = await bcrypt.hash(password, 10);
        const subject_assignment_id = await generateID('subject_assignment', connection);
        const date_joined = getCurrentDay();
        const classData = await getClassData(class_domain, class_group, class_arm);

        if (classData.length === 0) throw new NotFoundError('Class not found');
        if (classData[0].form_teacher) throw new ErrorHandler('Teacher already assigned', 409);

        await connection.execute(
            `INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [staff_id, fName, lName, mName || null, dob, gender, contact, 'teacher', password_hash]
        );

        await connection.execute(
            `INSERT INTO school_teacher VALUES (?, ?)`,
            [staff_id, date_joined]
        );

        await connection.execute(
            `UPDATE class_arm SET form_teacher = ? WHERE arm_id = ?`,
            [staff_id, classData[0].arm_id]
        );

        await connection.execute(
            `INSERT INTO subject_assignment VALUES (?, ?, ?, ?)`,
            [subject_assignment_id, class_group, subject_id, staff_id]
        );

        await connection.commit();

        return {
            staff_id,
            password,
            teacher: teacherData,
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getAllTeachers = async () => {
    const [data] = await connectionPool.execute(`
        SELECT
            usr.user_id as staff_id,
            usr.fName, usr.lName, usr.mName, usr.gender,
            sub.subject_name,
            cd.domain_name, cg.group_name, ca.arm_name,
            usr.contact
        FROM users usr
        LEFT JOIN school_teacher st ON st.staff_id = usr.user_id
        LEFT JOIN class_arm ca ON ca.form_teacher = st.staff_id
        LEFT JOIN class_group cg ON ca.group_id = cg.group_id
        LEFT JOIN class_domain cd ON cd.domain_id = cg.domain_id
        LEFT JOIN subject_assignment sa ON sa.teacher_id = st.staff_id
        LEFT JOIN subject sub ON sub.subject_id = sa.subject_id
        WHERE usr.user_role = 'teacher'
        ORDER BY st.staff_id
    `);

    if (data.length === 0) throw new NotFoundError('No teacher registered yet');

    return data;
};

const updateTeacher = async (id, update) => {
    if (!id) throw new ValidationErrorHandler('teacher id is required', 400);

    const {
        fName, lName, mName,
        class_domain, class_group, class_arm,
        contact, dob, gender, subject_id
    } = update;

    const connection = await connectionPool.getConnection();

    try {
        const teacher = await getTeacherByID(id);
        if (!teacher) throw new NotFoundError('Teacher not found');

        const classData = await getClassData(class_domain, class_group, class_arm);
        if (classData.length === 0) throw new NotFoundError('Class not found');

        await connection.beginTransaction();

        await connection.execute(
            `UPDATE users
             SET fName = ?, lName = ?, mName = ?, contact = ?, dob = ?, gender = ?
             WHERE user_id = ?`,
            [fName, lName, mName || null, contact, dob, gender, id]
        );

        await connection.execute(
            `UPDATE class_arm SET form_teacher = ? WHERE arm_id = ?`,
            [id, class_arm]
        );

        await connection.execute(
            `UPDATE subject_assignment SET subject_id = ?
             WHERE teacher_id = ? AND group_id = ?`,
            [subject_id, id, class_group]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const removeTeacher = async (id) => {
    if (!id) throw new ValidationErrorHandler('teacher id is required', 400);

    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();

        
        await connection.execute(
            `DELETE FROM subject_assignment WHERE teacher_id = ?`,
            [id]
        )
        await connection.execute(
            `DELETE FROM users WHERE user_id = ?`,
            [id]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getClassData = async (class_domain, class_group, class_arm) => {
    const [class_data] = await connectionPool.execute(
        `SELECT cd.domain_name, cg.group_name, ca.arm_name, ca.arm_id, ca.form_teacher
         FROM class_arm ca
         JOIN class_group cg ON cg.group_id = ca.group_id
         JOIN class_domain cd ON cd.domain_id = cg.domain_id
         WHERE ca.arm_id = ? AND cg.group_id = ? AND cd.domain_id = ?`,
        [class_arm, class_group, class_domain]
    );

    return class_data;
};

module.exports = {
    createTeacher, getAllTeachers, updateTeacher, removeTeacher
};