
const connectionPool = require('../config/database');
const { NotFoundError, ErrorHandler } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');

const saveStudentGrade = async (grade) => {

    const { student_id, subject_id, term, firstCA, secondCA, exam } = grade;
    const connection = await connectionPool.getConnection();
    const currentYear = new Date().getFullYear();

    try {
        await connection.beginTransaction();

        const grade_id = await generateID('grade', connection)
        const school_session = `${currentYear - 1}/${currentYear}`;

        // Math taught in jss1 is different form that which is taught in another class_group so they will have different id
        const [subject] = await connection.execute(`
            SELECT assignment_id FROM
            subject_assignment WHERE subject_id = ?
        `, [subject_id]);
        
        if(subject.length === 0) throw new ErrorHandler('No teacher available for this perticular subject', 400)
        await connection.execute(`
            INSERT INTO student_grades
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [grade_id, student_id, subject[0].assignment_id, school_session, term, firstCA, secondCA, exam]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const getGrades = async (user_id) => {

    if (/^(ADM)s?\d{6}$/.test(user_id)) {

        const [data] = await connectionPool.execute(`
            SELECT
                sg.grade_id, 
                sg.student_id, fName,
                lName, mName,
                s.subject_name, sg.term,
                sg.school_session, sg.firstCA,
                sg.secondCA, sg.exam
            FROM student_grades sg
            JOIN subject_assignment sa
                ON sg.assignment_id = sa.assignment_id
            JOIN subject s
                ON s.subject_id = sa.subject_id
            JOIN users usr
                ON usr.user_id = sg.student_id
            ORDER BY sg.student_id
        `);

        return data;
    }

    if (/^(TCH)s?\d{6}$/.test(user_id)) {

        const [class_arm] = await connectionPool.execute(`
            SELECT arm_id FROM
            class_arm WHERE form_teacher = ?
        `, [user_id]);

        const [data] = await connectionPool.execute(`
            SELECT
                sg.grade_id, 
                sg.student_id, fName,
                lName, mName,
                s.subject_name, sg.term,
                sg.school_session, sg.firstCA,
                sg.secondCA, sg.exam
            FROM student_grades sg
            JOIN subject_assignment sa
                ON sg.assignment_id = sa.assignment_id
            JOIN subject s
                ON s.subject_id = sa.subject_id
            JOIN users usr
                ON usr.user_id = sg.student_id
            JOIN student_class sc
                ON sc.admission_no = usr.user_id
            WHERE sc.arm_id = ?
            ORDER BY sg.student_id
        `, [class_arm[0].arm_id]);

        return data;
    }

    if (/^(STU)s?\d{6}$/.test(user_id)) {

        const [data] = await connectionPool.execute(`
            SELECT
                sg.grade_id, 
                sg.student_id, fName,
                lName, mName,
                s.subject_name, sg.term,
                sg.school_session, sg.firstCA,
                sg.secondCA, sg.exam
            FROM student_grades sg
            JOIN subject_assignment sa
                ON sg.assignment_id = sa.assignment_id
            JOIN subject s
                ON s.subject_id = sa.subject_id
            JOIN users usr
                ON usr.user_id = sg.student_id
            JOIN student_class sc
                ON sc.admission_no = usr.user_id
            WHERE sg.student_id = ?
            ORDER BY sg.student_id
        `, [user_id]);

        return data;
    }

    throw new ErrorHandler('Invalid user id', 400);
}

const updateGrade = async (id, update) => {

    const { firstCA, secondCA, exam } = update;
    const connection = await connectionPool.getConnection();

    try {

        await connection.beginTransaction();

        const [exist] = await connection.execute('SELECT grade_id FROM student_grades WHERE grade_id = ?', [id]);
        if (exist.length === 0) throw new NotFoundError('Record dosent exists');

        await connection.execute(`
            UPDATE student_grades
            SET 
                firstCA = ?,
                secondCA = ?,
                exam = ?
            WHERE grade_id = ?
        `, [firstCA, secondCA, exam, id]
        );
        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const removeGrade = async (id) => {

    const [exist] = await connectionPool.execute('SELECT grade_id FROM student_grades WHERE grade_id = ?', [id]);
    if (exist.length === 0) throw new NotFoundError('Record dosent exists');

    await connectionPool.execute('DELETE FROM student_grades WHERE grade_id = ?', [id]);
}

module.exports = { saveStudentGrade, getGrades, updateGrade, removeGrade };