
const connectionPool = require('../config/database');
const { NotFoundError, ValidationErrorHandler, ErrorHandler } = require('../middleware/errorHandler');
const { getCurrentDay } = require('../utils/dateUtils');
const { generateID } = require('../utils/idGenerator');

const saveAttendance = async (record) => {

    const {
        form_teacher,
        class_domain,
        class_group,
        class_arm,
        attendance_record,
    } = record;

    const connection = await connectionPool.getConnection();

    try {

        await connection.beginTransaction();

        const attendance_id = await generateID('attendance', connection);
        const date_taken = getCurrentDay();
        const getArm = await getExistingArm(class_domain, class_group, class_arm);

        if (getArm.length === 0) throw new NotFoundError('Class not found');
        if (getArm[0].form_teacher !== form_teacher) throw new ValidationErrorHandler('Wrong teacher for class' + getArm[0].arm_id, 403);

        await connection.execute(`
            INSERT INTO attendance VALUES
            (?, ?, ?, ?)
        `, [attendance_id, date_taken, form_teacher, class_arm]
        );

        for (let record of attendance_record) {
            await insertRecords(attendance_id,record.student_id,record.status, connection);
        }

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    };
}

const getAll = async () => {
    const [attendance] = await connectionPool.execute(`
        SELECT
            att.attendance_id,
            att.date_taken,
            att.form_teacher,
            att.class_arm,
            ca.arm_name,
            cg.group_name,
            cd.domain_name
        FROM attendance att
        LEFT JOIN class_arm ca
            ON ca.arm_id = att.class_arm
        LEFT JOIN class_group cg
            ON cg.group_id = ca.group_id
        LEFT JOIN class_domain cd
            ON cd.domain_id = cd.domain_id
        ORDER BY att.date_taken DESC
    `);

    if (attendance.length === 0) throw new ErrorHandler('No attendance record yet', 400);
    
    const map = new Map();
    for (let att of attendance){
        
        const student_record = await getRecord(att.attendance_id);
        map.set(att.attendance_id, { ...att, student_record});
    }
    
    return [...map.values()];
}

const getRecord = async (attendance_id, student_id = null) => {

    const [data] = await connectionPool.execute(`
        SELECT 
            ar.student_id,
            ar.status,
            usr.fName,
            usr.lName,
            usr.mName
        FROM attendance_record ar
        LEFT JOIN users usr
            ON usr.user_id = ar.student_id
        WHERE attendance_id = ?
    `, [attendance_id]);

    if (data.length === 0) throw new ErrorHandler('Attendance has not been taken yet for this class', 404);
    
    if (student_id) {
        return data.filter(rec => rec.student_id === student_id);
    }
    return data;
}

const getClassAttendanceAdmin = async (class_arm) => {        //admin

    const [data] = await connectionPool.execute('SELECT * FROM class_arm WHERE arm_id = ?', [class_arm]);

    if (data.length === 0) throw new NotFoundError('Class not found');

    const [attendance] = await connectionPool.execute(`
           SELECT
            att.attendance_id,
            att.date_taken,
            att.form_teacher,
            att.class_arm,
            ca.arm_name,
            cg.group_name,
            cd.domain_name
        FROM attendance att
        LEFT JOIN class_arm ca
            ON ca.arm_id = att.class_arm
        LEFT JOIN class_group cg
            ON cg.group_id = ca.group_id
        LEFT JOIN class_domain cd
            ON cd.domain_id = cd.domain_id
        WHERE att.class_arm = ?
            `, [class_arm]
    );

    if (attendance.length === 0) throw new ErrorHandler('No attendance record yet', 404);

    const map = new Map();

    for (let att of attendance){

        const student_record = await getRecord(att.attendance_id);
        map.set(att.attendance_id, {...att, student_record});
    }

    return [...map.values()];
}

const getClassAttendanceTeacher = async (form_teacher) => {

    const [attendance] = await connectionPool.execute(`
            SELECT
            att.attendance_id,
            att.date_taken,
            att.form_teacher,
            att.class_arm,
            ca.arm_name,
            cg.group_name,
            cd.domain_name
        FROM attendance att
        LEFT JOIN class_arm ca
            ON ca.arm_id = att.class_arm
        LEFT JOIN class_group cg
            ON cg.group_id = ca.group_id
        LEFT JOIN class_domain cd
            ON cd.domain_id = cd.domain_id
        WHERE att.form_teacher = ?
            `, [form_teacher]);

    if (attendance.length === 0) throw new ErrorHandler('No attendance record yet', 404)
    
    const map = new Map();

    for (let att of attendance){

        const student_record = await getRecord(att.attendance_id);
        map.set(att.attendance_id, {...att, student_record});
    }

    return [...map.values()];
}

const updateStudentAttendance = async (attendance_id, newRecord) => {         // for teacher

    const {
        form_teacher,
        attendance_record
    } = newRecord;

    if(!form_teacher) throw new ValidationErrorHandler('Invalid request');
   
    const connection = await connectionPool.getConnection();

    try {
        
        const [attendance] = await connection.execute(`
        SELECT
            attendance_id
        FROM attendance
        WHERE form_teacher = ? AND attendance_id = ?
        `, [form_teacher, attendance_id]);

        if (attendance.length === 0) throw new NotFoundError('No attendance recorded yet', 404);
        
        for (let record of attendance_record){

            await connection.execute(`
                UPDATE attendance_record
                SET status = ?
                WHERE attendance_id = ?
                AND student_id = ?
            `, [record.status, attendance_id, record.student_id]);
        }
    
        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    };
}

const getStudentAttendanceStudent = async (student_id) => {

    const [student_class] = await connectionPool.execute(
        `SELECT arm_id FROM student_class WHERE admission_no = ?`, [student_id]
    );

    if (!student_class[0]) throw new NotFoundError('No attendance taken yet');
   
    const [attendance] = await connectionPool.execute(`
        SELECT
            attendance_id,
            date_taken,
            form_teacher,
            class_arm
        FROM attendance
        WHERE class_arm = ?
        `, [student_class[0].arm_id]);

    if (attendance.length === 0) throw new NotFoundError('Attendance not taken yet');
    
    const map = new Map();
    for (let att of attendance){
        
        const student_record = await getRecord(att.attendance_id, student_id);
        map.set(att.attendance_id, {...att, student_record});
    }

    return [...map.values()];
}

const removeAttendance = async (attendance_id) => {

    if(!attendance_id) throw new ValidationErrorHandler('Attendance ID not provided');

    const connection = await connectionPool.getConnection();

    try {
    
        await connection.execute(`
            DELETE FROM attendance WHERE attendance_id = ?
        `, [attendance_id]);

        connection.commit();

    } catch (error) {
        
        await connection.rollback();
        throw error;
    } finally{

        connection.release();
    }
}

const insertRecords = async (attendance_id, student_id, status = 'absent', connection) => {

    await connection.execute(`
        INSERT INTO attendance_record VALUES
        (?, ?, ?)
        `, [attendance_id, student_id, status]
    );
}

const getExistingArm = async (class_domain, class_group, class_arm) => {

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
            WHERE cd.domain_id = ?
            AND cg.group_id = ?
            AND ca.arm_id = ?
        `, [class_domain, class_group, class_arm]
    );
    return data;
}

module.exports = {
    saveAttendance,
    getAll,
    getClassAttendanceAdmin,
    getClassAttendanceTeacher,
    updateStudentAttendance,
    getStudentAttendanceStudent,
    removeAttendance
};