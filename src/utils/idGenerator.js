const connectionPool = require('../config/database');

const sources = Object.freeze({
    admin: { prefix: 'ADM', table: 'users', column: 'user_id' },
    teacher: { prefix: 'TCH', table: 'users', column: 'user_id' },
    student: { prefix: 'STU', table: 'users', column: 'user_id' },
    guardian: { prefix: 'GUR', table: 'student_guardian', column: 'guardian_id' },
    class_domain: { prefix: 'CLD', table: 'class_domain', column: 'domain_id' },
    class_group: { prefix: 'CLG', table: 'class_group', column: 'group_id' },
    class_arm: { prefix: 'CLA', table: 'class_arm', column: 'arm_id' },
    subject: { prefix: 'SUB', table: 'subject', column: 'subject_id' },
    subject_assignment: { prefix: 'ASG', table: 'subject_assignment', column: 'assignment_id' },
    attendance: { prefix: 'ATT', table: 'attendance', column: 'attendance_id' },
    announcement: { prefix: 'ANN', table: 'announcement', column: 'announcement_id' },
    grade: { prefix: 'GRD', table: 'student_grades', column: 'grade_id' },
    time_slot: { prefix: 'SLT', table: 'timetable_slot', column: 'slot_id' },
});

exports.generateID = async (role, connection = connectionPool) => {
    const source = sources[role];
    if (!source) throw new Error(`Unknown ID role: ${role}`);

    const year = new Date().getFullYear().toString().substring(2);
    const stem = source.prefix + year;

    const [rows] = await connection.execute(
        `SELECT MAX(${source.column}) AS last_id FROM ${source.table} WHERE ${source.column} LIKE ?`,
        [`${stem}%`]
    );

    const last = rows[0].last_id;
    const next = last ? Number(last.substring(5)) + 1 : 1;

    if (next > 9999) throw new Error(`ID limit reached for ${stem}`);

    return stem + String(next).padStart(4, '0');
};