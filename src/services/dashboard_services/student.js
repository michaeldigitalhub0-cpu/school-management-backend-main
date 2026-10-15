
const connectionPool = require('../../config/database');
const { NotFoundError } = require('../../middleware/errorHandler');
const { getCurrentDay, getCurrentDayName } = require('../../utils/dateUtils');

const getMyDetailsStudent = async (student_id) => {
    const [data] = await connectionPool.execute(`
        SELECT
            stu.admission_no,
            stu.year_admitted,
            cd.domain_name AS class_domain,
            cd.domain_id,
            cg.group_name AS class_group,
            cg.group_id,
            ca.arm_name AS class_arm,
            ca.arm_id,
            usr.fName AS student_fName,
            usr.mName AS student_mName,
            usr.lName AS student_lName,
            usr.contact AS student_contact,
            usr.gender,
            sg.fName AS guardian_fName,
            sg.mName AS guardian_mName,
            sg.lName AS guardian_lName,
            sg.contact AS guardian_contact
        FROM users usr
        LEFT JOIN school_student stu
            ON stu.admission_no = usr.user_id
        LEFT JOIN student_guardian sg
            ON sg.guardian_id = stu.guardian_id
        LEFT JOIN student_class sc
            ON sc.admission_no = usr.user_id
        LEFT JOIN class_arm ca
            ON sc.arm_id = ca.arm_id
        LEFT JOIN class_group cg
            ON ca.group_id = cg.group_id
        LEFT JOIN class_domain cd
            ON cg.domain_id = cd.domain_id
        WHERE usr.user_id = ? AND usr.user_role = 'student'
        ORDER BY usr.user_id
    `, [student_id]);

    if (data.length === 0) throw new NotFoundError('Student not found');

    const [total] = await connectionPool.execute(
        `SELECT * FROM student_class WHERE arm_id = ?`,
        [data[0].arm_id]
    );

    return { ...data[0], class_total: total.length };
};

const getCurrentAttendanceStudent = async (arm_id, student_id) =>{

    const today = getCurrentDay();

    const [attendance] = await connectionPool.execute(`
        SELECT 
            attendance_id
        FROM attendance
        WHERE class_arm = ? 
        AND date_taken = ?
    `, [arm_id, today]);

    if(attendance.length === 0) throw new NotFoundError('Attendance has not been recorded for today');

    const [record] = await connectionPool.execute(`
        SELECT 
            *
        FROM attendance_record
        WHERE attendance_id = ?
    `, [attendance[0].attendance_id]);
    
    const student_record = record.filter(r => r.student_id === student_id);
        console.log({attendance_status: student_record[0].status});
    return {attendance_status: student_record[0].status};
}

const getOverallAttendance = async (arm_id, student_id) =>{

    const [attendance] = await connectionPool.execute(`
        SELECT 
            attendance_id
        FROM attendance
        WHERE class_arm = ?
    `, [arm_id]);

    if(attendance.length === 0) throw new NotFoundError('No attendance taken for your class yet');

    const map = new Map();
    for (let att of attendance){
        
        const student_record = await getRecord(att.attendance_id, student_id);
        map.set(att.attendance_id, { ...att, student_record});
    }
    
    let total_att = 0, present = 0, absent = 0;

    map.forEach(el =>{

        total_att++;

        el.student_record.forEach(rec=>{

            rec.status === 'present'? present++ : absent++;
        })
    })
   
    return {percentage_present: total_att === 0 ? 0 : (present / total_att)*100 }
}

const getRecord = async (attendance_id, student_id) => {

    const [data] = await connectionPool.execute(`
        SELECT 
            ar.student_id,
            ar.status
        FROM attendance_record ar
        WHERE attendance_id = ?
    `, [attendance_id]);

    if (data.length === 0) throw new ErrorHandler('Attendance has not been taken yet for this class', 404);

    if (student_id) {
        return data.filter(rec => rec.student_id === student_id);
    }

    return data;
}

const getTimeTableStudent = async (class_arm) =>{

    const today = getCurrentDayName();

    const [data] = await connectionPool.execute(`
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
        WHERE ts.arm_id = ? AND ts.day_of_week = ?
        ORDER BY FIELD(ts.day_of_week, 'monday','tuesday','wednesday','thursday','friday'), ts.slot_id   
    `, [class_arm, today]);

    return data;
}

module.exports = {getTimeTableStudent, getMyDetailsStudent, getCurrentAttendanceStudent, getOverallAttendance};