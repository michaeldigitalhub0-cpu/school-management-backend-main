
const connectionPool = require('../../config/database');
const { NotFoundError } = require('../../middleware/errorHandler');
const { getCurrentDay } = require('../../utils/dateUtils');

const today = getCurrentDay();

const getAllStudents = async () => {

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
        WHERE usr.user_role = 'student'
        ORDER BY usr.user_id
    `);

    return {students: data, student_total: data.length};
}

const getAllTeachers = async () => {

    const [data] = await connectionPool.execute(`
        SELECT 
            * 
        FROM school_teacher 
    `);

    return data.length;
}

const getAllCLasses = async () => {

    const [data] = await connectionPool.execute(`
        SELECT 
            * 
        FROM class_arm 
    `);

    return data.length;
}

const getCurrentAttendance = async () => {

    const [attendance] = await connectionPool.execute(`
        SELECT 
            * 
        FROM attendance 
        WHERE date_taken = ?
    `, [today]);

    if(attendance.length === 0) throw new NotFoundError('Attendancehas not been recorded for today');
    

    const map = new Map();
    for (let att of attendance){
        
        const student_record = await getRecord(att.attendance_id);
        map.set(att.attendance_id, { ...att, student_record});
    }
    
    let totalStudents = 0, present = 0, absent = 0, percentage = 0;

    map.forEach(el => {

        el.student_record.forEach(rec => {
            totalStudents++;
            rec.status === 'present' ? present++ : absent++;
        })
    })

    percentage = totalStudents === 0 ? 0 : (present / totalStudents).toFixed(2) * 100;  
    
    return {total_present: present, total_absent:absent, percentage_present: percentage}
}

const getRecord = async (attendance_id) => {

    const [data] = await connectionPool.execute(`
        SELECT 
            ar.student_id,
            ar.status
        FROM attendance_record ar
        WHERE ar.attendance_id = ?
    `, [attendance_id]);

    if (data.length === 0) throw new ErrorHandler('Attendance has not been taken yet for this class', 404);

    return data;
}

const getRecentAnnouncement = async () =>{
    
    const [data] = await connectionPool.execute(`
        SELECT 
            *
        FROM announcement
        WHERE date_posted = ?    
    `, [today]);

    return data;
}

module.exports = {getAllStudents, getAllCLasses, getAllTeachers, getCurrentAttendance, getRecentAnnouncement}