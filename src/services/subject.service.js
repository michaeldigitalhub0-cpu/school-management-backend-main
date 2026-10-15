
const connectionPool = require('../config/database');
const { NotFoundError, ErrorHandler, ValidationErrorHandler } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');

const createSubject = async (subject_data) => {

    const { subject_name, group_id } = subject_data;

    const connection = await connectionPool.getConnection();

    try {

        await connection.beginTransaction();

        const subject_id = await generateID('subject', connection);

        const [data] = await connection.execute(
            `SELECT group_id FROM class_group WHERE group_id = ?`,
            [group_id]
        );

        if (data.length === 0) throw new NotFoundError('Class group not found');

        await connection.execute(
            `
                INSERT INTO subject VALUES (?, ?, ?)
            `, [subject_id, subject_name, group_id]
        );

        await connection.commit();
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const getAllSubjects = async () => {
    const [data] = await connectionPool.execute(`
        SELECT 
            s.subject_id,
            s.subject_name,
            cg.group_id,
            cg.group_name,
            cd.domain_id,
            cd.domain_name
        FROM subject s
        JOIN class_group cg
            ON cg.group_id = s.group_id
        JOIN class_domain cd
            ON cd.domain_id = cg.domain_id
        ORDER BY s.subject_id
    `);
    return data;
}

const getSubjectByClassGroup = async (group_id) => {

    if(!group_id) throw new ValidationErrorHandler('class group id is required');
    const [data] = await connectionPool.execute(`
        SELECT
            s.subject_id,
            s.subject_name,
            cg.group_id,
            cg.group_name,
            cd.domain_id,
            cd.domain_name
        FROM subject s
        JOIN class_group cg
            ON cg.group_id = s.group_id
        JOIN class_domain cd
            ON cd.domain_id = cg.domain_id
        WHERE s.group_id = ?
    `, [group_id]);

    return data;
}

const getSubjectByID = async (subject_id) => {

    if(!subject_id) throw new ValidationErrorHandler('subject id is required');

    const [data] = await connectionPool.execute(`
        SELECT
            s.subject_id,
            s.subject_name,
            cg.group_id,
            cg.group_name,
            cd.domain_id,
            cd.domain_name
        FROM subject s
        JOIN class_group cg
            ON cg.group_id = s.group_id
        JOIN class_domain cd
            ON cd.domain_id = cg.domain_id
        WHERE s.subject_id = ?
    `, [subject_id]);

    if (data.length === 0) throw new NotFoundError('Subject not found');

    return data[0];
};

const updateSubjectData = async (id, update) => {

    if(!id) throw new ValidationErrorHandler('subject id is required');

    const { subject_name } = update;
    const connection = await connectionPool.getConnection();

    try {

        await connection.beginTransaction();

        const [subject] = await connection.execute('SELECT subject_name FROM subject WHERE subject_id = ?', [id]);

        if (subject.length === 0) throw new NotFoundError('Subject not found');

        await connection.execute(`
            UPDATE subject
            SET subject_name = ?
            WHERE subject_id = ?
        `, [subject_name, id]);

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const removeSubject = async (subject_id) => {

    if(!subject_id) throw new ValidationErrorHandler('subject id is required');

    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();

        const [existing] = await connection.execute(
            `SELECT subject_id FROM subject WHERE subject_id = ?`, [subject_id]
        );
        if (existing.length === 0) throw new NotFoundError('Subject not found');

        const [grades] = await connection.execute(
            `
                SELECT sg.grade_id FROM student_grades sg
                JOIN subject_assignment sa ON sa.assignment_id = sg.assignment_id
                WHERE sa.subject_id = ?
                LIMIT 1
            `, [subject_id]
        );
        if (grades.length > 0) throw new ErrorHandler('Subject has recorded grades and cannot be deleted', 409);

        await connection.execute(`DELETE FROM subject WHERE subject_id = ?`, [subject_id]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { createSubject, getAllSubjects, getSubjectByClassGroup, getSubjectByID, updateSubjectData, removeSubject }