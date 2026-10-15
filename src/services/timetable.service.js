// services/timetable.service.js

const connectionPool = require('../config/database');
const { NotFoundError } = require('../middleware/errorHandler');
const { generateID } = require('../utils/idGenerator');
const { getCurrentDayName } = require('../utils/dateUtils');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const createTimeTable = async (table) => {
    const { class_domain, class_group, class_arm, period } = table;
    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const classData = await getClassData(class_domain, class_group, class_arm);
        if (classData.length === 0) throw new NotFoundError('Class not found');

        await insertSlots(connection, class_arm, class_group, period);

        await connection.commit();
        return { class_arm, period };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const insertSlots = async (connection, class_arm, class_group, period) => {
    for (const slot of period) {
        const daysPresent = DAYS.filter(day => slot[day]);

        if (daysPresent.length === 0) {
            for (const day of DAYS) {
                const slot_id = await generateID('time_slot', connection);
                await connection.execute(
                    `INSERT INTO timetable_slot VALUES (?, ?, NULL, NULL, ?, ?)`,
                    [slot_id, class_arm, day, slot.time]
                );
            }
            continue;
        }

        for (const day of daysPresent) {
            const [assignment] = await connection.execute(
                `SELECT assignment_id, teacher_id FROM subject_assignment WHERE subject_id = ? AND group_id = ?`,
                [slot[day].subject_id, class_group]
            );

            if (assignment.length === 0)
                throw new NotFoundError(`Subject ${slot[day].subject_id} not assigned to this group`);

            const slot_id = await generateID('time_slot', connection);
            await connection.execute(
                `INSERT INTO timetable_slot VALUES (?, ?, ?, ?, ?, ?)`,
                [slot_id, class_arm, assignment[0].assignment_id, assignment[0].teacher_id, day, slot.time]
            );
        }
    }
};

const getClassData = async (class_domain, class_group, class_arm) => {
    const [class_data] = await connectionPool.execute(
        `
            SELECT
                cd.domain_name,
                cg.group_name,
                ca.arm_name,
                ca.arm_id
            FROM class_arm ca
            JOIN class_group cg
                ON cg.group_id = ca.group_id
            JOIN class_domain cd
                ON cd.domain_id = cg.domain_id
            WHERE ca.arm_id = ? AND cg.group_id = ? AND cd.domain_id = ?;
        `,
        [class_arm, class_group, class_domain]
    );

    return class_data;
};

const getTimetableByArm = async (arm_id) => {
    const [slots] = await connectionPool.execute(
        `
            SELECT
                ts.slot_id,
                ts.day_of_week,
                ts.time_allocated,
                COALESCE(sub.subject_name, 'Break') AS subject_name,
                usr.fName AS teacher_fName,
                usr.lName AS teacher_lName
            FROM timetable_slot ts
            LEFT JOIN subject_assignment sa ON sa.assignment_id = ts.assignment_id
            LEFT JOIN subject sub ON sub.subject_id = sa.subject_id
            LEFT JOIN users usr ON usr.user_id = ts.teacher_id
            WHERE ts.arm_id = ?
            ORDER BY FIELD(ts.day_of_week, 'monday','tuesday','wednesday','thursday','friday'), ts.slot_id
        `, [arm_id]
    );

    return slots;
};

const getMyTimetableTodayStudent = async (student_id) => {
    const today = getCurrentDayName();

    const [slots] = await connectionPool.execute(
        `
            SELECT
                ts.time_allocated,
                COALESCE(sub.subject_name, 'Break') AS subject_name,
                usr.fName AS teacher_fName,
                usr.lName AS teacher_lName
            FROM student_class sc
            LEFT JOIN timetable_slot ts ON ts.arm_id = sc.arm_id
            LEFT JOIN subject_assignment sa ON sa.assignment_id = ts.assignment_id
            LEFT JOIN subject sub ON sub.subject_id = sa.subject_id
            LEFT JOIN users usr ON usr.user_id = ts.teacher_id
            WHERE sc.admission_no = ? AND ts.day_of_week = ?
            ORDER BY ts.time_allocated
        `, [student_id, today]
    );

    return slots;
};

const getMyTimetableTodayTeacher = async (teacher_id) => {
    const today = getCurrentDayName();

    const [slots] = await connectionPool.execute(
        `
            SELECT 
                cg.group_name,
                ca.arm_name,
                ts.time_allocated,
                ts.day_of_week,
                s.subject_name
            FROM timetable_slot ts
            JOIN class_arm ca
            ON ca.arm_id = ts.arm_id
            JOIN class_group cg
            ON cg.group_id = ca.group_id
            JOIN subject_assignment sa
            ON sa.teacher_id = ts.teacher_id
            JOIN subject s
            ON s.subject_id = sa.subject_id
            WHERE ts.teacher_id = ? AND ts.day_of_week = ?
            ORDER BY ts.slot_id
        `, [teacher_id, today]
    );

    return slots;
};

const updateTimeTable = async (table) => {
    const { class_domain, class_group, class_arm, period } = table;
    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const classData = await getClassData(class_domain, class_group, class_arm);
        if (classData.length === 0) throw new NotFoundError('Class not found');

        const [existing] = await connection.execute(
            `SELECT slot_id FROM timetable_slot WHERE arm_id = ? LIMIT 1`, [class_arm]
        );
        if (existing.length === 0)
            throw new NotFoundError('No timetable exists for this class yet');

        await connection.execute(`DELETE FROM timetable_slot WHERE arm_id = ?`, [class_arm]);
        await insertSlots(connection, class_arm, class_group, period);

        await connection.commit();
        return { class_arm, period };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const removeTimeTable = async (arm_id) => {
    const connection = await connectionPool.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.execute(
            `SELECT slot_id FROM timetable_slot WHERE arm_id = ? LIMIT 1`, [arm_id]
        );
        if (existing.length === 0)
            throw new NotFoundError('No timetable exists for this class');

        await connection.execute(`DELETE FROM timetable_slot WHERE arm_id = ?`, [arm_id]);

        await connection.commit();

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { 
    createTimeTable,
    updateTimeTable, 
    removeTimeTable, 
    getTimetableByArm, 
    getMyTimetableTodayStudent, 
    getMyTimetableTodayTeacher 
};
