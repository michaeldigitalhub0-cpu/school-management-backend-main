-- SQLBook: Code
-- =====================================================================
-- SCHOOL MANAGEMENT SYSTEM — SCHEMA (reverted to the original plan)
-- Entities: USERS (covers admin directly, no admin subtype — admin has
-- zero extra attributes), STUDENT, TEACHER, CLASS (domain->group->arm),
-- SUBJECT, ATTENDANCE, TIMETABLE, GRADES, ANNOUNCEMENT.
-- Version 1.0.0
-- =====================================================================

DROP DATABASE IF EXISTS school_management_system;

CREATE DATABASE school_management_system;

USE school_management_system;

-- =====================================================================
-- 1. USERS (supertype — covers admin directly via user_role; admin has
--    no attributes beyond what's here, so there is no separate
--    school_admin table)
-- =====================================================================
CREATE TABLE users (
    user_id CHAR(9) NOT NULL,
    fName VARCHAR(15) NOT NULL,
    lName VARCHAR(15) NOT NULL,
    mName VARCHAR(15),
    dob DATE NOT NULL,
    gender CHAR NOT NULL,
    contact VARCHAR(11) NOT NULL,
    user_role VARCHAR(10) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT uq_users_contact UNIQUE (contact),
    CONSTRAINT chk_user_gender CHECK (gender IN ('M', 'F')),
    CONSTRAINT chk_user_role CHECK (
        user_role IN ('admin', 'teacher', 'student')
    )
);

-- =====================================================================
-- 2. SUBTYPES OF USER — TEACHER and STUDENT only
-- =====================================================================

CREATE TABLE school_teacher (
    staff_id CHAR(9) NOT NULL,
    date_joined DATE,
    PRIMARY KEY (staff_id),
    FOREIGN KEY (staff_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE student_guardian (
    guardian_id CHAR(9) NOT NULL,
    fName VARCHAR(15) NOT NULL,
    lName VARCHAR(15) NOT NULL,
    mName VARCHAR(15) DEFAULT NULL,
    contact VARCHAR(11) NOT NULL,
    PRIMARY KEY (guardian_id)
);

CREATE TABLE school_student (
    admission_no CHAR(9) NOT NULL,
    year_admitted INT NOT NULL,
    guardian_id CHAR(9) DEFAULT NULL,
    PRIMARY KEY (admission_no),
    FOREIGN KEY (admission_no) REFERENCES users (user_id) ON DELETE CASCADE,
    FOREIGN KEY (guardian_id) REFERENCES student_guardian (guardian_id) ON DELETE SET NULL
);


-- =====================================================================
-- 3. CLASS HIERARCHY: DOMAIN -> GROUP -> ARM
-- =====================================================================

CREATE TABLE class_domain (
    domain_id CHAR(9) NOT NULL,
    domain_name VARCHAR(15) NOT NULL,
    PRIMARY KEY (domain_id),
    CONSTRAINT uq_domain_name UNIQUE (domain_name)
);

CREATE TABLE class_group (
    group_id CHAR(9) NOT NULL,
    domain_id CHAR(9) NOT NULL,
    group_name VARCHAR(10) NOT NULL,
    PRIMARY KEY (group_id),
    FOREIGN KEY (domain_id) REFERENCES class_domain (domain_id) ON DELETE CASCADE,
    CONSTRAINT uq_group_per_domain UNIQUE (domain_id, group_name)
);

CREATE TABLE class_arm (
    arm_id CHAR(9) NOT NULL,
    group_id CHAR(9) NOT NULL,
    arm_name CHAR NOT NULL,
    form_teacher CHAR(9) DEFAULT NULL,
    PRIMARY KEY (arm_id),
    FOREIGN KEY (group_id) REFERENCES class_group (group_id) ON DELETE CASCADE,
    FOREIGN KEY (form_teacher) REFERENCES school_teacher (staff_id),
    CONSTRAINT uq_form_teacher UNIQUE (form_teacher), -- 1 teacher = 1 arm
    CONSTRAINT uq_arm_per_group UNIQUE (group_id, arm_name)
);

CREATE TABLE student_class (
    admission_no CHAR(9) NOT NULL,
    arm_id CHAR(9) NOT NULL,
    PRIMARY KEY (admission_no),
    FOREIGN KEY (admission_no) REFERENCES school_student (admission_no) ON DELETE CASCADE,
    Foreign Key (arm_id) REFERENCES class_arm (arm_id) ON DELETE CASCADE
);

-- =====================================================================
-- 4. SUBJECTS AND ASSIGNMENTS
-- =====================================================================

CREATE TABLE subject (
    subject_id CHAR(9) NOT NULL,
    subject_name VARCHAR(20) NOT NULL,
    group_id CHAR(9) NOT NULL,
    PRIMARY KEY (subject_id),
    CONSTRAINT uq_subject_name UNIQUE (subject_name),
    constraint uq_subject_per_group UNIQUE (subject_name, group_id),
    Foreign Key (group_id) REFERENCES class_group (group_id)
);

CREATE TABLE subject_assignment (
    assignment_id CHAR(9) NOT NULL,
    group_id CHAR(9) NOT NULL,
    subject_id CHAR(9) NOT NULL,
    teacher_id CHAR(9),
    PRIMARY KEY (assignment_id),
    FOREIGN KEY (group_id) REFERENCES class_group (group_id),
    FOREIGN KEY (subject_id) REFERENCES subject (subject_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES school_teacher (staff_id),
    CONSTRAINT uq_teacher_assignment UNIQUE (
        group_id,
        subject_id,
        teacher_id
    )
);

-- =====================================================================
-- 5. TIMETABLE
-- =====================================================================

CREATE TABLE timetable_slot (
    slot_id CHAR(9) NOT NULL,
    arm_id CHAR(9) NOT NULL,
    assignment_id CHAR(9) DEFAULT NULL,
    teacher_id CHAR(9) DEFAULT NULL, -- denormalized from subject_assignment, for conflict checking
    day_of_week VARCHAR(10) NOT NULL,
    time_allocated CHAR(11) NOT NULL,
    PRIMARY KEY (slot_id),
    FOREIGN KEY (arm_id) REFERENCES class_arm (arm_id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES subject_assignment (assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES school_teacher (staff_id),
    CONSTRAINT uq_arm_day_period UNIQUE (
        arm_id,
        day_of_week,
        time_allocated
    ),
    CONSTRAINT uq_teacher_day_period UNIQUE (
        teacher_id,
        day_of_week,
        time_allocated
    )
);

-- =====================================================================
-- 6. ATTENDANCE (event + per-student outcome)
-- =====================================================================

CREATE TABLE attendance (
    attendance_id CHAR(9) NOT NULL,
    date_taken DATE NOT NULL,
    form_teacher CHAR(9) NOT NULL,
    class_arm CHAR(9) NOT NULL,
    PRIMARY KEY (attendance_id),
    FOREIGN KEY (form_teacher) REFERENCES school_teacher (staff_id),
    FOREIGN KEY (class_arm) REFERENCES class_arm (arm_id) ON DELETE CASCADE,
    CONSTRAINT uq_arm_date UNIQUE (class_arm, date_taken)
);

CREATE TABLE attendance_record (
    attendance_id CHAR(9) NOT NULL,
    student_id CHAR(9) NOT NULL,
    status VARCHAR(10) NOT NULL,
    PRIMARY KEY (attendance_id, student_id),
    FOREIGN KEY (attendance_id) REFERENCES attendance (attendance_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES school_student (admission_no) ON DELETE CASCADE,
    CONSTRAINT chk_attendance_status CHECK (
        status IN ('present', 'absent')
    )
);

-- =====================================================================
-- 7. GRADES
-- =====================================================================

CREATE TABLE student_grades (
    grade_id CHAR(9) NOT NULL,
    student_id CHAR(9) NOT NULL,
    assignment_id CHAR(9) NOT NULL,
    school_session CHAR(9) NOT NULL,
    term VARCHAR(15) NOT NULL,
    firstCA DECIMAL(4, 1) DEFAULT 0.0,
    secondCA DECIMAL(4, 1) DEFAULT 0.0,
    exam DECIMAL(4, 1) DEFAULT 0.0,
    PRIMARY KEY (grade_id),
    FOREIGN KEY (student_id) REFERENCES school_student (admission_no) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES subject_assignment (assignment_id) ON DELETE CASCADE,
    CONSTRAINT uq_student_assignment_term UNIQUE (
        student_id,
        assignment_id,
        school_session,
        term
    )
);

-- =====================================================================
-- 8. ANNOUNCEMENT (audience-based broadcast — admin or teacher to all/
--    students/teachers)
-- =====================================================================

CREATE TABLE announcement (
    announcement_id CHAR(9) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body VARCHAR(500) NOT NULL,
    audience VARCHAR(10) NOT NULL,
    posted_by CHAR(9) NOT NULL,
    date_posted DATE NOT NULL,
    PRIMARY KEY (announcement_id),
    FOREIGN KEY (posted_by) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT chk_announcement_audience CHECK (
        audience IN ('all', 'students', 'teachers')
    )
);