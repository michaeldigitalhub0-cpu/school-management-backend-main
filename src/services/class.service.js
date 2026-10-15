
const connectionPool = require('../config/database');
const { NotFoundError, ErrorHandler, ValidationErrorHandler } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');

const createClass = async (classData) => {

    const {
        domain_name,
        group_name,
        arm_name,
        form_teacher
    } = classData;

    const connection = await connectionPool.getConnection();

    const getDomain = await getExistingDomain(domain_name);
    const getGroup = await getExistingGroup(domain_name, group_name);
    const getArm = await getExistingArm(domain_name, group_name, arm_name);

    try {
        await connection.beginTransaction();

        const classDomainID = await generateID('class_domain', connection);
        const classGroupID = await generateID('class_group', connection);
        const classArmID = await generateID('class_arm', connection);

        if (getDomain.length === 0) {

            await connection.execute(
                `
                INSERT INTO class_domain VALUES
                (?, ?)
            `, [classDomainID, domain_name]
            );

            await connection.execute(
                `
                INSERT INTO class_group VALUES
                (?, ?, ?)
            `, [classGroupID, classDomainID, group_name]
            );

            await connection.execute(
                `
                INSERT INTO class_arm VALUES
                (?, ?, ?, ?)
            `, [classArmID, classGroupID, arm_name, form_teacher || null]
            );

        } else if (
            getDomain[0].domain_name === domain_name &&
            getGroup[0] === undefined
        ) {

            await connection.execute(
                `
                    INSERT INTO class_group VALUES
                    (?, ?, ?)
                `, [classGroupID, getDomain[0].domain_id, group_name]
            );

            await connection.execute(
                `
                    INSERT INTO class_arm VALUES
                    (?, ?, ?, ?)
                `, [classArmID, classGroupID, arm_name, form_teacher || null]
            );
        } else if (

            getDomain[0].domain_name === domain_name &&
            getGroup[0].group_name === group_name &&
            getArm[0] === undefined
        ) {

            await connection.execute(
                `
                    INSERT INTO class_arm VALUES
                    (?, ?, ?, ?)
                `, [classArmID, getGroup[0].group_id, arm_name, form_teacher || null]
            );
        } else {
            throw new ErrorHandler('Class arm already exists', 409);
        }
        await connection.commit();

        return classData;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getAll = async () => {

    const [classes] = await connectionPool.execute(
        `
            SELECT
                cd.domain_id,
                cd.domain_name,
                cg.group_id,
                cg.group_name,
                ca.arm_id,
                ca.arm_name,
                ca.form_teacher,
                usr.fName AS teacher_fName,
                usr.lName AS teacher_lName,
                usr.mName AS teacher_mName
            FROM class_domain cd
            JOIN class_group cg
                ON cg.domain_id = cd.domain_id
            JOIN class_arm ca
                ON ca.group_id = cg.group_id
            LEFT JOIN users usr
                ON usr.user_id = ca.form_teacher
            ORDER BY cg.group_name
        `
    );


    return classes;
};

const getStudents = async (arm_id) => {

    if(!arm_id) throw new ValidationErrorHandler('ID not provided', 400)
    const [data] = await connectionPool.execute(`
        SELECT 
            admission_no AS student_id,
            usr.fName AS student_fName,
            usr.lName AS student_lName,
            usr.mName AS student_mName
            FROM student_class
            JOIN users usr
            ON usr.user_id = admission_no
            WHERE arm_id = ?`, [arm_id]);

    return data;
}

const getFormTeacherClass = async (teacher_id) => {

    const [data] = await connectionPool.execute(
        `
            SELECT
                cd.domain_id,
                cd.domain_name,
                cg.group_id,
                cg.group_name,
                ca.arm_id,
                ca.arm_name,
                ca.form_teacher
            FROM class_domain cd
            JOIN class_group cg
                ON cg.domain_id = cd.domain_id
            JOIN class_arm ca
                ON ca.group_id = cg.group_id
            WHERE ca.form_teacher = ?
        `, [teacher_id]
    );

    if (data.length === 0) throw new NotFoundError('Class not found');

    return data[0];
}

const updateClassArm = async (domain_name, group_name, arm_name, form_teacher) => {


    const connection = await connectionPool.getConnection();

    const classData = await getExistingArm(domain_name, group_name, arm_name);
    console.log(classData);
    if (classData.length === 0) throw new NotFoundError('Class not found');

    try {

        await connection.beginTransaction();

        await connection.execute(
            `
                UPDATE class_arm SET form_teacher = ? WHERE arm_name = ? AND group_id = ?
            `, [form_teacher, arm_name, classData[0].group_id]
        );

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const removeDomain = async (id) => {

    if(!id) throw new ValidationErrorHandler('Id is required', 400);
    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();
        const [data] = await connection.execute(
            `SELECT domain_id FROM class_domain WHERE domain_id = ?`, [id]
        );
        if (data.length === 0) throw new NotFoundError('Class domain not found');
        await connection.execute(`DELETE FROM class_domain WHERE domain_id = ?`, [id]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const removeGroup = async (id) => {

    if(!id) throw new ValidationErrorHandler('Id is required', 400);
    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();
        const [data] = await connection.execute(
            `SELECT group_id FROM class_group WHERE group_id = ?`, [id]
        );
        if (data.length === 0) throw new NotFoundError('Class group not found');
        await connection.execute(`DELETE FROM class_group WHERE group_id = ?`, [id]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const removeArm = async (id) => {

    if(!id) throw new ValidationErrorHandler('Id is required', 400);
    const connection = await connectionPool.getConnection();
    try {
        await connection.beginTransaction();
        const [data] = await connection.execute(
            `SELECT arm_id FROM class_arm WHERE arm_id = ?`, [id]
        );
        if (data.length === 0) throw new NotFoundError('Class arm not found');
        await connection.execute(`DELETE FROM class_arm WHERE arm_id = ?`, [id]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getExistingDomain = async (class_domain) => {

    const [data] = await connectionPool.execute(
        `
            SELECT
                domain_name,
                domain_id
            FROM class_domain
            WHERE domain_name = ?
        `, [class_domain]
    );
    return data;
}

const getExistingGroup = async (class_domain, class_group) => {

    const [data] = await connectionPool.execute(
        `
            SELECT
                cd.domain_name,
                cd.domain_id,
                cg.group_id,
                cg.group_name
            FROM class_domain cd
            JOIN class_group cg
            ON cg.domain_id = cd.domain_id
            WHERE domain_name = ? AND group_name = ?
        `, [class_domain, class_group]
    );
    return data;
}

const getExistingArm = async (class_domain, class_group, class_arm) => {

    console.log(class_domain, class_group, class_arm);
    const [data] = await connectionPool.execute(
        `
            SELECT
                cd.domain_name,
                cd.domain_id,
                cg.group_id,
                cg.group_name,
                ca.arm_id,
                ca.arm_name,
                ca.form_teacher
            FROM class_domain cd
            JOIN class_group cg
            ON cg.domain_id = cd.domain_id
            JOIN class_arm ca
            ON ca.group_id = cg.group_id
            WHERE domain_name = ?
            AND group_name = ?
            AND arm_name = ?
        `, [class_domain, class_group, class_arm]
    );
    console.log(data);
    return data;
}

module.exports = {
    createClass,
    getAll,
    getFormTeacherClass,
    getStudents,
    updateClassArm,
    removeDomain,
    removeGroup,
    removeArm
}
