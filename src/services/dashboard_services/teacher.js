

const connectionPool = require('../../config/database');
const { NotFoundError } = require('../../middleware/errorHandler');
const { getCurrentDayName, getCurrentDay } = require('../../utils/dateUtils');

const getMyDetailsTeacher = async (teacher_id) => {
    const [teacher] = await connectionPool.execute(`
        SELECT
            usr.user_id as staff_id,
            usr.fName, usr.lName, usr.mName,
            sub.subject_name,
            cd.domain_name, cd.domain_id,
            cg.group_name, cg.group_id,
            ca.arm_name, ca.arm_id,
            usr.contact
        FROM users usr
        LEFT JOIN school_teacher st ON st.staff_id = usr.user_id
        LEFT JOIN class_arm ca ON ca.form_teacher = st.staff_id
        LEFT JOIN class_group cg ON ca.group_id = cg.group_id
        LEFT JOIN class_domain cd ON cd.domain_id = cg.domain_id
        LEFT JOIN subject_assignment sa ON sa.teacher_id = st.staff_id
        LEFT JOIN subject sub ON sub.subject_id = sa.subject_id
        WHERE usr.user_id = ?
    `, [teacher_id]);

    if (teacher.length === 0) throw new NotFoundError('Teacher not found');

    return teacher[0];
};


const getClassStudents = async (form_teacher) => {
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
            usr.contact AS student_contact,
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
        WHERE usr.user_role = 'student' AND ca.form_teacher = ?
        ORDER BY usr.user_id
    `, [form_teacher]);

    return data;
};

const getCurrentAttendanceTeacher = async (form_teacher) =>{

    const today = getCurrentDay();

    const [attendance] = await connectionPool.execute(`
        SELECT 
            attendance_id
        FROM attendance
        WHERE form_teacher = ? 
        AND date_taken = ?
    `, [form_teacher, today]);

    if(attendance.length === 0) throw new NotFoundError('Attendance has not been recorded for today');

    const [record] = await connectionPool.execute(`
        SELECT 
            *
        FROM attendance_record
        WHERE attendance_id = ?
    `, [attendance[0].attendance_id]);
    
    let total = 0, present = 0, percentage = 0;
    record.forEach(rec => {
        total++;
        (rec.status === 'present') ? present++ : present;
    })


    return {record, total_present: present, percentage: total === 0 ? 0 : (present/total).toFixed(2)*100};
}

const getClassTimeTable = async (arm_id) => {

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
            WHERE ts.arm_id = ?
            ORDER BY FIELD(ts.day_of_week, 'monday','tuesday','wednesday','thursday','friday'), ts.slot_id
    `, [arm_id]);

    return data;
}

const getTimeTable = async (teacher_id) =>{
    console.log(teacher_id);
    const today = getCurrentDayName();
    console.log(today);
    const [data] = await connectionPool.execute(`
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
    `, [teacher_id, today]);
        
    return data;
}

module.exports = {getMyDetailsTeacher, getClassStudents, getCurrentAttendanceTeacher, getClassTimeTable, getTimeTable};