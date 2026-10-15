const bcrypt = require('bcryptjs');

const connectionPool = require('../config/database');
const { NotFoundError, ValidationErrorHandler } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');
const { generateUserPassword } = require('../utils/passwordGenerator');


exports.createStudent = async (studentData) => {
    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const admission_no = await generateID('student', connection);
        const guardian_id = await generateID('guardian', connection);

        const currentYear = new Date().getFullYear();

        const class_data = await getClassData(
            studentData.class_domain,
            studentData.class_group,
            studentData.class_arm
        );

        if (class_data.length === 0) {
            throw new NotFoundError('Class not found');
        }

        const password = generateUserPassword();
        const password_hash = await bcrypt.hash(password, 10);

        await connection.execute(
            'INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                admission_no, studentData.fName,
                studentData.lName, studentData.mName || null,
                studentData.dob, studentData.gender,
                studentData.contact, 'student',
                password_hash
            ]
        );

        await connection.execute(
            'INSERT INTO student_guardian VALUES (?, ?, ?, ?, ?)',
            [
                guardian_id,
                studentData.guardian_fName,
                studentData.guardian_lName,
                studentData.guardian_mName || null,
                studentData.guardian_contact,
            ]
        );

        await connection.execute(
            'INSERT INTO school_student VALUES (?, ?, ?)',
            [admission_no, currentYear, guardian_id]
        );

        await connection.execute(
            'INSERT INTO student_class VALUES (?, ?)',
            [admission_no, class_data[0].arm_id]
        );

        await connection.commit();

        return {
            admission_no,
            password,
            student: studentData,
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.getAll = async () => {
    const [data] = await connectionPool.execute(`
        SELECT
            stu.admission_no,
            stu.year_admitted,
            cd.domain_name AS class_domain,
            cg.group_name AS class_group,
            ca.arm_name AS class_arm,
            usr.fName AS student_fName,
            usr.mName AS student_mName,
            usr.lName AS student_lName,
            usr.gender,
            usr.contact AS student_contact,
            sg.fName AS guardian_fName,
            sg.mName AS guardian_mName,
            sg.lName AS guardian_lName,
            sg.contact AS guardian_contact
        FROM users usr
        JOIN school_student stu
            ON stu.admission_no = usr.user_id
        LEFT JOIN student_guardian sg
            ON sg.guardian_id = stu.guardian_id
        JOIN student_class sc
            ON sc.admission_no = usr.user_id
        JOIN class_arm ca
            ON sc.arm_id = ca.arm_id
        JOIN class_group cg
            ON ca.group_id = cg.group_id
        JOIN class_domain cd
            ON cg.domain_id = cd.domain_id
        WHERE usr.user_role = 'student'
        ORDER BY usr.user_id
    `);

    return data;
};

exports.update = async (id, updates) => {
    if (!id) throw new ValidationErrorHandler('Student Id is required', 400);

    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            fName, lName, mName,
            class_domain, class_group, class_arm,
            contact, dob, gender,
            guardian_fName, guardian_lName, guardian_mName, guardian_contact
        } = updates;

        const student_guardian = await getStudentguardian(id);
        const class_data = await getClassData(class_domain, class_group, class_arm);

        if (student_guardian.length === 0 || class_data.length === 0) {
            throw new NotFoundError('guardian data or class data not found');
        }

        await connection.execute(
            `UPDATE users
             SET fName = ?, lName = ?, mName = ?, gender = ?, contact = ?, dob = ?
             WHERE user_id = ?`,
            [fName, lName, mName || null, gender, contact, dob, id]
        );

        await connection.execute(
            `UPDATE school_student SET guardian_id = ? WHERE admission_no = ?`,
            [student_guardian[0].guardian_id, id]
        );

        await connection.execute(
            `UPDATE student_guardian
             SET fName = ?, lName = ?, mName = ?, contact = ?
             WHERE guardian_id = ?`,
            [guardian_fName, guardian_lName, guardian_mName || null, guardian_contact, student_guardian[0].guardian_id]
        );

        await connection.execute(
            `UPDATE student_class SET arm_id = ? WHERE admission_no = ?`,
            [class_data[0].arm_id, id]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.remove = async (id) => {
    if (!id) throw new ValidationErrorHandler('Student Id is required', 400);

    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const [student] = await connection.execute(
            'SELECT user_id FROM users WHERE user_id = ?',
            [id]
        );
        if (student.length === 0) throw new NotFoundError('Student not found');

        const [guardian] = await connection.execute(
            'SELECT guardian_id FROM school_student WHERE admission_no = ?',
            [id]
        );

        await connection.execute('DELETE FROM users WHERE user_id = ?', [id]);

        if (guardian.length > 0) {
            await connection.execute(
                'DELETE FROM student_guardian WHERE guardian_id = ?',
                [guardian[0].guardian_id]
            );
        }

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
        `SELECT cd.domain_name, cg.group_name, ca.arm_name, ca.arm_id
         FROM class_arm ca
         JOIN class_group cg ON cg.group_id = ca.group_id
         JOIN class_domain cd ON cd.domain_id = cg.domain_id
         WHERE ca.arm_id = ? AND cg.group_id = ? AND cd.domain_id = ?`,
        [class_arm, class_group, class_domain]
    );

    return class_data;
};

const getStudentguardian = async (student_admission_no) => {
    const [data] = await connectionPool.execute(
        `SELECT guardian_id FROM school_student WHERE admission_no = ?`,
        [student_admission_no]
    );
    return data;
};
