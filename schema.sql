-- -------------------------------------------------------------
-- Schema Generated On: 2025-10-20
-- Final Expert Review Pass: 2025-10-27
-- This is a consolidated and optimized schema file.
-- -------------------------------------------------------------

-- Custom ENUM Types for Data Integrity
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'teacher', 'worker', 'head', 'finance', 'admin');
CREATE TYPE public.user_account_status AS ENUM ('pending_verification', 'active', 'suspended', 'deactivated');
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'active', 'archived');
CREATE TYPE public.enrollment_status AS ENUM ('pending_payment', 'waiting_start', 'active', 'completed', 'cancelled', 'pending_approval');
CREATE TYPE public.payment_status AS ENUM ('due', 'paid', 'late', 'waived', 'pending_review', 'pending_payout');
CREATE TYPE public.task_type AS ENUM ('homework', 'exam', 'reading', 'review', 'evaluation', 'submission', 'grade_item', 'daily_reading', 'daily_quiz', 'daily_wird', 'daily_evaluation', 'daily_monitoring', 'attendance_record', 'lesson_preparation', 'grading', 'performance_review', 'communication_followup', 'custom_daily', 'custom_fixed', 'project', 'preparation', 'weekly_report', 'weekly_evaluation');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.task_category_enum AS ENUM ('daily', 'fixed');
CREATE TYPE public.submission_status AS ENUM ('pending', 'submitted', 'graded', 'late');
CREATE TYPE public.attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.notification_type AS ENUM ('new_task', 'payment_reminder', 'meeting_reminder', 'message', 'announcement', 'course_published', 'course_launched', 'course_enrollment', 'course_approval_needed', 'course_auto_launched', 'course_message', 'grade_received', 'daily_task_scheduled', 'fixed_task_scheduled', 'performance_updated', 'exam_completed', 'daily_task_completed');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.assignment_status AS ENUM ('scheduled', 'posted', 'skipped-holiday');
CREATE TYPE public.worker_attendance_status AS ENUM ('present', 'late', 'absent', 'half_day', 'sick', 'vacation');
CREATE TYPE public.worker_report_type AS ENUM ('daily', 'weekly', 'monthly', 'project', 'incident');
CREATE TYPE public.worker_report_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved');
CREATE TYPE public.worker_event_type AS ENUM ('meeting', 'work', 'training', 'break', 'personal');
CREATE TYPE public.worker_task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.worker_eval_status AS ENUM ('draft', 'submitted', 'finalized');
CREATE TYPE public.worker_event_status AS ENUM ('scheduled', 'confirmed', 'cancelled');


-- Tables
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL,
    reports_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    avatar_url VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    account_status public.user_account_status DEFAULT 'pending_verification',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.users (role);
CREATE INDEX ON public.users (reports_to);

CREATE TABLE public.course_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    target_roles JSONB DEFAULT '[]'::jsonb,
    min_capacity INTEGER DEFAULT 7,
    max_capacity INTEGER DEFAULT 15,
    optimal_capacity INTEGER DEFAULT 12,
    pricing JSONB DEFAULT '{}'::jsonb,
    daily_content_template JSONB DEFAULT '[]'::jsonb,
    created_by INTEGER NOT NULL REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    participant_config JSONB DEFAULT '{}'::jsonb,
    auto_fill_template JSONB DEFAULT '{}'::jsonb,
    launch_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.course_templates (created_by);

CREATE TABLE public.courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES public.users(id),
    details JSONB DEFAULT '{}'::jsonb,
    status public.course_status DEFAULT 'draft',
    approved_by INTEGER REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    template_id INTEGER REFERENCES public.course_templates(id),
    min_enrollment INTEGER DEFAULT 7,
    max_enrollment INTEGER DEFAULT 15,
    duration_days INTEGER DEFAULT 7,
    start_date DATE,
    end_date DATE,
    days_per_week INTEGER DEFAULT 5,
    hours_per_day NUMERIC(3,1) DEFAULT 2.0,
    schedule_config JSONB,
    content_outline TEXT,
    auto_launch_settings JSONB DEFAULT '{}'::jsonb,
    participant_config JSONB DEFAULT '{}'::jsonb,
    is_published BOOLEAN DEFAULT false,
    is_launched BOOLEAN DEFAULT false,
    launched_at TIMESTAMPTZ,
    launch_date TIMESTAMPTZ,
    teacher_id INTEGER REFERENCES public.users(id),
    course_fee NUMERIC(10,2) DEFAULT 0.00,
    max_participants INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_days_per_week_valid CHECK (((days_per_week >= 1) AND (days_per_week <= 7))),
    CONSTRAINT check_duration_days_positive CHECK ((duration_days > 0)),
    CONSTRAINT check_hours_per_day_valid CHECK (((hours_per_day > (0)::numeric) AND (hours_per_day <= (24)::numeric))),
    CONSTRAINT check_max_enrollment_valid CHECK ((max_enrollment >= min_enrollment)),
    CONSTRAINT check_min_enrollment_positive CHECK ((min_enrollment > 0))
);
CREATE INDEX ON public.courses (created_by);
CREATE INDEX ON public.courses (approved_by);
CREATE INDEX ON public.courses (template_id);
CREATE INDEX ON public.courses (teacher_id);
CREATE INDEX ON public.courses (status);
CREATE INDEX ON public.courses (is_launched, is_published);


CREATE TABLE public.enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    status public.enrollment_status DEFAULT 'pending_payment' NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    grade JSONB,
    level_number INTEGER,
    preferred_days TEXT[],
    preferred_start_time TIME,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);
CREATE INDEX ON public.enrollments (user_id);
CREATE INDEX ON public.enrollments (course_id);
CREATE INDEX ON public.enrollments (status);


CREATE TABLE public.payments (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    due_date DATE NOT NULL,
    status public.payment_status DEFAULT 'due' NOT NULL,
    paid_at TIMESTAMPTZ,
    confirmed_by INTEGER REFERENCES public.users(id),
    notes TEXT,
    description TEXT,
    payment_proof_url VARCHAR(255),
    rejection_reason TEXT,
    transaction_id VARCHAR(255),
    payment_gateway_data JSONB
);
CREATE INDEX ON public.payments (enrollment_id);
CREATE INDEX ON public.payments (confirmed_by);
CREATE INDEX ON public.payments (status);


CREATE TABLE public.course_schedule (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_url VARCHAR(255),
    meeting_link VARCHAR(255),
    scheduled_date DATE,
    level_specific_content JSONB DEFAULT '{}'::jsonb,
    meeting_start_time TIME,
    meeting_end_time TIME,
    tasks_released BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    attendance_recorded BOOLEAN,
    meeting_password TEXT,
    meeting_instructions TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, day_number)
);
CREATE INDEX ON public.course_schedule (course_id);
CREATE INDEX ON public.course_schedule (scheduled_date);


CREATE TABLE public.course_task_templates (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    default_instructions TEXT,
    max_score NUMERIC(5,2) DEFAULT 100,
    is_daily BOOLEAN DEFAULT true,
    duration_hours INTEGER DEFAULT 24 NOT NULL,
    instructions TEXT,
    target_role VARCHAR(50) DEFAULT 'student',
    task_category public.task_category_enum,
    expires_in_hours INTEGER,
    auto_grade_reduction INTEGER DEFAULT 0,
    custom_deadline_days INTEGER DEFAULT 3,
    priority_level public.task_priority DEFAULT 'medium',
    task_type public.task_type,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, level_number, title)
);
CREATE INDEX ON public.course_task_templates (course_id);


CREATE TABLE public.tasks (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES public.course_schedule(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    level_number INTEGER,
    is_active BOOLEAN DEFAULT false,
    released_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES public.users(id),
    max_score NUMERIC(5,2) DEFAULT 100,
    instructions TEXT,
    source_template_id INTEGER REFERENCES public.course_task_templates(id) ON DELETE SET NULL,
    task_category public.task_category_enum DEFAULT 'daily',
    expires_in_hours INTEGER DEFAULT 24,
    auto_grade_reduction INTEGER DEFAULT 10,
    custom_deadline TIMESTAMPTZ,
    priority_level public.task_priority DEFAULT 'medium',
    activated_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    task_type public.task_type,
    CONSTRAINT tasks_auto_grade_reduction_check CHECK (((auto_grade_reduction >= 0) AND (auto_grade_reduction <= 100)))
);
CREATE INDEX ON public.tasks (schedule_id);
CREATE INDEX ON public.tasks (assigned_to);
CREATE INDEX ON public.tasks (created_by);
CREATE INDEX ON public.tasks (source_template_id);
CREATE INDEX ON public.tasks (due_date);
CREATE INDEX ON public.tasks (task_type);


CREATE TABLE public.submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status public.submission_status DEFAULT 'pending' NOT NULL,
    submitted_at TIMESTAMPTZ,
    content TEXT,
    grade NUMERIC(5,2),
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by INTEGER REFERENCES public.users(id),
    UNIQUE (task_id, user_id)
);
CREATE INDEX ON public.submissions (task_id);
CREATE INDEX ON public.submissions (user_id);
CREATE INDEX ON public.submissions (graded_by);
CREATE INDEX ON public.submissions (status);


CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES public.course_schedule(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    status public.attendance_status_enum DEFAULT 'present',
    notes TEXT,
    recorded_by INTEGER REFERENCES public.users(id),
    late_minutes INTEGER,
    behavior_score INTEGER,
    participation_score INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id, date)
);
CREATE INDEX ON public.attendance (user_id);
CREATE INDEX ON public.attendance (course_id);
CREATE INDEX ON public.attendance (schedule_id);
CREATE INDEX ON public.attendance (recorded_by);


CREATE TABLE public.parent_child_relationships (
    parent_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (parent_id, child_id)
);
CREATE INDEX ON public.parent_child_relationships (child_id);


CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    related_type VARCHAR(50),
    title VARCHAR(255),
    content TEXT,
    related_id INTEGER,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.notifications (user_id);
CREATE INDEX ON public.notifications (is_read);


CREATE TABLE public.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    subject VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.messages (sender_id);


CREATE TABLE public.message_recipients (
    message_id INTEGER NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (message_id, user_id)
);
CREATE INDEX ON public.message_recipients (user_id);


CREATE TABLE public.course_messages (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    parent_message_id INTEGER REFERENCES public.course_messages(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.course_messages (course_id);
CREATE INDEX ON public.course_messages (user_id);
CREATE INDEX ON public.course_messages (parent_message_id);


CREATE TABLE public.user_edit_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    status public.request_status DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX ON public.user_edit_requests (user_id);
CREATE INDEX ON public.user_edit_requests (reviewed_by);


CREATE TABLE public.verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, type),
    CONSTRAINT verification_tokens_type_check CHECK (((type)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying])::text[])))
);
CREATE INDEX ON public.verification_tokens (user_id);


CREATE TABLE public.announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority public.announcement_priority DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES public.users(id),
    target_roles TEXT[] DEFAULT ARRAY['student'::text, 'teacher'::text, 'admin'::text, 'parent'::text, 'worker'::text, 'finance'::text, 'head'::text],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.announcements (created_by);


CREATE TABLE public.certificates (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    grade NUMERIC(5,2)
);


CREATE TABLE public.daily_commitments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    commitment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    commitments JSONB DEFAULT '{}'::jsonb NOT NULL,
    UNIQUE (user_id, commitment_date)
);
CREATE INDEX ON public.daily_commitments (user_id);


CREATE TABLE public.course_auto_fill_templates (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name VARCHAR(200),
    description TEXT,
    meeting_link_template VARCHAR(500),
    content_url_template VARCHAR(500),
    url_numbering_start INTEGER DEFAULT 1,
    url_numbering_end INTEGER DEFAULT 10,
    default_assignments JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.course_auto_fill_templates (course_id);


CREATE TABLE public.course_auto_launch_log (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    launch_reason VARCHAR(100) NOT NULL,
    enrollment_counts JSONB NOT NULL,
    success BOOLEAN DEFAULT true,
    launched_by VARCHAR(50) DEFAULT 'system',
    participants_count INTEGER,
    launched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.course_auto_launch_log (course_id);


CREATE TABLE public.course_daily_progress (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE,
    tasks_released BOOLEAN DEFAULT false,
    progress_data JSONB,
    content_released BOOLEAN,
    meeting_completed BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, day_number)
);
CREATE INDEX ON public.course_daily_progress (course_id);


CREATE TABLE public.exams (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    questions JSONB DEFAULT '[]'::jsonb NOT NULL,
    time_limit INTEGER DEFAULT 60,
    max_attempts INTEGER DEFAULT 1,
    passing_score NUMERIC(5,2) DEFAULT 60.00,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, day_number)
);
CREATE INDEX ON public.exams (course_id);
CREATE INDEX ON public.exams (created_by);


CREATE TABLE public.exam_questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT,
    points NUMERIC(5,2) DEFAULT 1.00,
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.exam_questions (exam_id);


CREATE TABLE public.exam_submissions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}'::jsonb NOT NULL,
    score NUMERIC(5,2),
    total_questions INTEGER,
    correct_answers INTEGER,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    time_taken INTEGER,
    attempt_number INTEGER DEFAULT 1,
    passed BOOLEAN,
    total_points NUMERIC(5,2),
    UNIQUE (exam_id, user_id, attempt_number)
);
CREATE INDEX ON public.exam_submissions (exam_id);
CREATE INDEX ON public.exam_submissions (user_id);


CREATE TABLE public.course_ratings (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id),
    daily_ratings JSONB,
    overall_rating NUMERIC(3, 1),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, user_id)
);
CREATE INDEX ON public.course_ratings (course_id);
CREATE INDEX ON public.course_ratings (user_id);


CREATE TABLE public.course_participant_levels (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    target_roles TEXT[] NOT NULL,
    min_count INTEGER DEFAULT 1,
    max_count INTEGER DEFAULT 10,
    optimal_count INTEGER DEFAULT 5,
    requirements JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, level_number)
);
CREATE INDEX ON public.course_participant_levels (course_id);


CREATE TABLE public.performance_evaluations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    task_completion_score NUMERIC(5,2) DEFAULT 0,
    quality_score NUMERIC(5,2) DEFAULT 0,
    timeliness_score NUMERIC(5,2) DEFAULT 0,
    overall_score NUMERIC(5,2) DEFAULT 0,
    performance_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id, evaluation_date)
);
CREATE INDEX ON public.performance_evaluations (user_id);
CREATE INDEX ON public.performance_evaluations (course_id);


CREATE TABLE public.contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.contact_messages (email);


CREATE TABLE public.assignment_templates (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX ON public.assignment_templates (teacher_id);
CREATE INDEX ON public.assignment_templates (course_id);


CREATE TABLE public.assignment_occurrences (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES public.assignment_templates(id) ON DELETE CASCADE,
    publish_at TIMESTAMPTZ NOT NULL,
    status public.assignment_status DEFAULT 'scheduled' NOT NULL,
    UNIQUE(template_id, publish_at)
);
CREATE INDEX ON public.assignment_occurrences (template_id);


CREATE TABLE public.teacher_schedules (
    teacher_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    days TEXT NOT NULL,
    publish_time TEXT NOT NULL,
    is_paused BOOLEAN DEFAULT false NOT NULL,
    holidays DATERANGE[] DEFAULT '{}'::daterange[],
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (teacher_id, course_id),
    CONSTRAINT teacher_schedules_days_check CHECK ((days ~ '^(sat|sun|mon|tue|wed|thu|fri)(,(sat|sun|mon|tue|wed|thu|fri))*$')),
    CONSTRAINT teacher_schedules_publish_time_check CHECK ((publish_time ~ '^[0-2][0-9]:[0-5][0-9]$'))
);


CREATE TABLE public.course_schedule_changes (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES public.course_schedule(id),
    changed_by INTEGER NOT NULL REFERENCES public.users(id),
    change_type VARCHAR(50),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.course_schedule_changes (schedule_id);
CREATE INDEX ON public.course_schedule_changes (changed_by);


CREATE TABLE public.user_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    activity_type VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.user_activity_log (user_id);
CREATE INDEX ON public.user_activity_log (activity_type);


CREATE TABLE public.course_rating_settings (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE UNIQUE,
    attendance_weight NUMERIC(5,2) DEFAULT 20,
    participation_weight NUMERIC(5,2) DEFAULT 20,
    task_completion_weight NUMERIC(5,2) DEFAULT 30,
    exam_weight NUMERIC(5,2) DEFAULT 30,
    teaching_quality_weight NUMERIC(5,2) DEFAULT 20,
    auto_calculate BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE public.daily_spiritual_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_date DATE NOT NULL,
    tasks JSONB DEFAULT '{}'::jsonb,
    UNIQUE (user_id, task_date)
);
CREATE INDEX ON public.daily_spiritual_tasks (user_id);


CREATE TABLE public.user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_date DATE NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_type, achievement_date)
);
CREATE INDEX ON public.user_achievements (user_id);


CREATE TABLE public.worker_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100),
    assigned_to INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    status public.worker_task_status DEFAULT 'pending',
    priority public.task_priority DEFAULT 'medium',
    estimated_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    completion_date TIMESTAMPTZ
);
CREATE INDEX ON public.worker_tasks (assigned_to);
CREATE INDEX ON public.worker_tasks (assigned_by);
CREATE INDEX ON public.worker_tasks (status);


CREATE TABLE public.worker_attendance (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    total_hours NUMERIC(4, 2),
    status public.worker_attendance_status NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (worker_id, date)
);
CREATE INDEX ON public.worker_attendance (worker_id);


CREATE TABLE public.worker_performance_evaluations (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    evaluator_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_rating NUMERIC(3, 2),
    punctuality_rating NUMERIC(3, 2),
    quality_rating NUMERIC(3, 2),
    communication_rating NUMERIC(3, 2),
    teamwork_rating NUMERIC(3, 2),
    initiative_rating NUMERIC(3, 2),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    status public.worker_eval_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.worker_performance_evaluations (worker_id);
CREATE INDEX ON public.worker_performance_evaluations (evaluator_id);


CREATE TABLE public.worker_reports (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_type public.worker_report_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    report_date DATE NOT NULL,
    tags TEXT[],
    priority public.task_priority DEFAULT 'normal',
    status public.worker_report_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.worker_reports (worker_id);


CREATE TABLE public.worker_schedule_events (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    event_type public.worker_event_type NOT NULL,
    location VARCHAR(255),
    status public.worker_event_status DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ON public.worker_schedule_events (worker_id);


-- Functions (Reviewed and Updated)

CREATE OR REPLACE FUNCTION get_available_courses_for_user(p_user_id INT, p_user_role TEXT)
RETURNS TABLE (
    id INT,
    name VARCHAR,
    description TEXT,
    details JSONB,
    status public.course_status,
    created_at TIMESTAMPTZ,
    is_published BOOLEAN,
    student_count BIGINT
) AS $function$
BEGIN
    IF p_user_role = 'student' THEN
        RETURN QUERY
            SELECT
                c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count
            FROM courses c
            WHERE c.is_published = true AND c.is_launched = false
            AND NOT EXISTS (
                SELECT 1 FROM enrollments e2 WHERE e2.course_id = c.id AND e2.user_id = p_user_id
            )
            AND EXISTS (
                SELECT 1 FROM enrollments e1 JOIN users u1 ON e1.user_id = u1.id
                WHERE e1.course_id = c.id AND u1.role IN ('admin', 'head')
            )
            AND EXISTS (
                SELECT 1 FROM enrollments e3 JOIN users u3 ON e3.user_id = u3.id
                WHERE e3.course_id = c.id AND u3.role IN ('teacher', 'worker')
            )
            ORDER BY c.created_at DESC;
    ELSE
        RETURN QUERY
            SELECT
                c.id, c.name, c.description, c.details, c.status, c.created_at, c.is_published,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count
            FROM courses c
            WHERE c.is_published = true AND c.is_launched = false
            AND NOT EXISTS (
                SELECT 1 FROM enrollments e2 WHERE e2.course_id = c.id AND e2.user_id = p_user_id
            )
            ORDER BY c.created_at DESC;
    END IF;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION overlaps_holidays(holiday_ranges DATERANGE[], check_date TIMESTAMPTZ)
RETURNS BOOLEAN AS $function$
DECLARE
    r DATERANGE;
BEGIN
    IF holiday_ranges IS NULL THEN
        RETURN FALSE;
    END IF;
    FOREACH r IN ARRAY holiday_ranges
    LOOP
        IF check_date::date <@ r THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    RETURN FALSE;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_course_tasks_from_templates(p_course_id INT)
RETURNS void AS $function$
BEGIN
    INSERT INTO tasks (schedule_id, title, description, due_date, assigned_to, level_number, created_by, max_score, instructions, task_type)
    SELECT
        cs.id,
        ctt.title,
        ctt.description,
        cs.scheduled_date + (ctt.duration_hours || ' hours')::interval,
        e.user_id,
        ctt.level_number,
        ctt.created_by,
        ctt.max_score,
        ctt.instructions,
        ctt.task_type
    FROM course_task_templates ctt
    JOIN course_schedule cs ON cs.course_id = ctt.course_id
    JOIN enrollments e ON e.course_id = ctt.course_id AND e.status = 'active'
    WHERE ctt.course_id = p_course_id
    ON CONFLICT DO NOTHING;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_auto_launch_conditions(p_course_id INT)
RETURNS BOOLEAN AS $function$
DECLARE
    v_min_enrollment INT;
    v_current_enrollment INT;
    v_start_date DATE;
BEGIN
    SELECT min_enrollment, start_date INTO v_min_enrollment, v_start_date
    FROM courses WHERE id = p_course_id;

    SELECT COUNT(*) INTO v_current_enrollment
    FROM enrollments WHERE course_id = p_course_id AND status IN ('active', 'waiting_start');

    IF v_start_date <= CURRENT_DATE AND v_current_enrollment >= v_min_enrollment THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_daily_tasks_for_course(p_course_id INT)
RETURNS void AS $function$
BEGIN
    PERFORM create_course_tasks_from_templates(p_course_id);
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_user_performance(p_user_id INT, p_course_id INT)
RETURNS JSONB AS $function$
DECLARE
    v_task_stats RECORD;
    v_attendance_stats RECORD;
    v_overall_score NUMERIC;
    v_level_number INT;
BEGIN
    -- Get task completion and grade stats
    SELECT
        COUNT(t.id) AS total_tasks,
        COUNT(CASE WHEN s.status = 'graded' THEN 1 END) AS completed_tasks,
        AVG(s.grade) FILTER (WHERE s.status = 'graded') AS average_grade,
        COUNT(CASE WHEN s.submitted_at <= t.due_date THEN 1 END) AS on_time_submissions
    INTO v_task_stats
    FROM tasks t
    LEFT JOIN submissions s ON t.id = s.task_id AND s.user_id = p_user_id
    WHERE t.schedule_id IN (SELECT id FROM course_schedule WHERE course_id = p_course_id) AND t.assigned_to = p_user_id;

    -- Get attendance stats
    SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_sessions
    INTO v_attendance_stats
    FROM attendance
    WHERE user_id = p_user_id AND course_id = p_course_id;
    
    -- Get user's level
    SELECT level_number INTO v_level_number FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id;

    -- Calculate overall score (example weights)
    v_overall_score := 
        (COALESCE(v_task_stats.completed_tasks, 0) / NULLIF(v_task_stats.total_tasks, 0) * 50) + -- 50% for completion
        (COALESCE(v_task_stats.average_grade, 0) / 100 * 30) + -- 30% for grade
        (COALESCE(v_attendance_stats.present_sessions, 0) / NULLIF(v_attendance_stats.total_sessions, 0) * 20); -- 20% for attendance

    RETURN jsonb_build_object(
        'level_number', v_level_number,
        'task_completion_rate', COALESCE(v_task_stats.completed_tasks, 0) / NULLIF(v_task_stats.total_tasks, 0) * 100,
        'average_grade', v_task_stats.average_grade,
        'on_time_completion_rate', COALESCE(v_task_stats.on_time_submissions, 0) / NULLIF(v_task_stats.total_tasks, 0) * 100,
        'attendance_rate', COALESCE(v_attendance_stats.present_sessions, 0) / NULLIF(v_attendance_stats.total_sessions, 0) * 100,
        'overall_score', v_overall_score,
        'last_calculated', NOW()
    );
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_course_content(p_template_id INT, p_course_id INT)
RETURNS JSONB AS $function$
DECLARE
    template RECORD;
    course_duration INT;
    content JSONB := '[]'::jsonb;
    item JSONB;
    n INT;
BEGIN
    SELECT * INTO template FROM course_auto_fill_templates WHERE id = p_template_id;
    SELECT duration_days INTO course_duration FROM courses WHERE id = p_course_id;

    FOR n IN template.url_numbering_start..template.url_numbering_end LOOP
        IF n > course_duration THEN
            EXIT;
        END IF;

        item := jsonb_build_object(
            'day_number', n,
            'title', 'اليوم ' || n,
            'meeting_link', replace(template.meeting_link_template, '{n}', n::text),
            'content_url', replace(template.content_url_template, '{n}', n::text)
        );
        content := content || item;
    END LOOP;

    RETURN content;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id INT)
RETURNS TABLE (
    contact_id INT,
    contact_name VARCHAR,
    last_message_at TIMESTAMPTZ
) AS $function$
BEGIN
    RETURN QUERY
        SELECT DISTINCT ON (c.contact_id) c.contact_id, c.contact_name, c.last_message_at
        FROM (
            SELECT
                CASE WHEN m.sender_id = p_user_id THEN mr.user_id ELSE m.sender_id END as contact_id,
                u.full_name as contact_name,
                m.sent_at as last_message_at
            FROM public.messages m
            JOIN public.message_recipients mr ON m.id = mr.message_id
            JOIN public.users u ON u.id = (CASE WHEN m.sender_id = p_user_id THEN mr.user_id ELSE m.sender_id END)
            WHERE m.sender_id = p_user_id OR mr.user_id = p_user_id
        ) as c
        WHERE c.contact_id != p_user_id
        ORDER BY c.contact_id, c.last_message_at DESC;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_performance_dashboard(p_user_id INT)
RETURNS JSONB AS $function$
DECLARE
    v_performance JSONB;
    v_public_stats JSONB;
    v_course_averages JSONB;
    v_benchmarks JSONB;
    v_trends JSONB;
    v_result JSONB;
BEGIN
    -- 1. User-specific performance
    WITH user_stats AS (
        SELECT
            AVG(s.grade) as average_grade,
            COUNT(*) as graded_tasks
        FROM public.submissions s
        WHERE s.user_id = p_user_id AND s.status = 'graded'
    ),
    user_timeline AS (
        SELECT jsonb_agg(jsonb_build_object('title', t.title, 'grade', s.grade) ORDER BY s.submitted_at ASC) as timeline
        FROM public.submissions s
        JOIN public.tasks t ON s.task_id = t.id
        WHERE s.user_id = p_user_id AND s.status = 'graded'
        AND s.id IN (SELECT id FROM public.submissions WHERE user_id = p_user_id AND status = 'graded' ORDER BY submitted_at DESC LIMIT 10)
    ),
    user_course_perf AS (
        SELECT jsonb_agg(jsonb_build_object('name', c.name, 'course_avg', avg(s.grade))) as course_performance
        FROM public.submissions s
        JOIN public.tasks t ON s.task_id = t.id
        JOIN public.course_schedule cs ON t.schedule_id = cs.id
        JOIN public.courses c ON cs.course_id = c.id
        WHERE s.user_id = p_user_id AND s.status = 'graded'
        GROUP BY c.name
    )
    SELECT jsonb_build_object(
        'average_grade', (SELECT average_grade FROM user_stats),
        'graded_tasks', (SELECT graded_tasks FROM user_stats),
        'timeline', (SELECT timeline FROM user_timeline),
        'course_performance', (SELECT course_performance FROM user_course_perf)
    )
    INTO v_performance;

    -- 2. Public stats
    SELECT to_jsonb(s) INTO v_public_stats FROM (
        SELECT
            AVG(grade) as avg_grade_all_users,
            COUNT(*) as total_submissions,
            COUNT(DISTINCT user_id) as active_users,
            MAX(grade) as highest_grade,
            MIN(grade) as lowest_grade
        FROM public.submissions
        WHERE status = 'graded' AND grade IS NOT NULL
    ) s;

    -- 3. Course averages
    SELECT jsonb_agg(ca) INTO v_course_averages FROM (
        SELECT
            c.name,
            AVG(s.grade) as course_avg,
            COUNT(s.id) as submission_count
        FROM public.submissions s
        JOIN public.tasks t ON s.task_id = t.id
        JOIN public.course_schedule cs ON t.schedule_id = cs.id
        JOIN public.courses c ON cs.course_id = c.id
        WHERE s.status = 'graded' AND s.grade IS NOT NULL
        GROUP BY c.id, c.name
        ORDER BY course_avg DESC
        LIMIT 10
    ) ca;

    -- 4. Benchmarks
    SELECT to_jsonb(b) INTO v_benchmarks FROM (
        SELECT
            AVG(CASE WHEN e.status = 'completed' THEN 100 ELSE 0 END) as avg_completion_rate,
            COUNT(DISTINCT c.id) as total_courses,
            COUNT(DISTINCT e.user_id) as total_participants,
            AVG(CASE WHEN e.status = 'completed' THEN
                EXTRACT(EPOCH FROM (e.enrolled_at - c.launched_at)) / 86400
                ELSE NULL END) as avg_completion_days
        FROM public.courses c
        LEFT JOIN public.enrollments e ON c.id = e.course_id
        WHERE c.status IN ('active', 'archived') AND c.teacher_id IS NOT NULL
        AND c.created_at >= CURRENT_DATE - INTERVAL '12 months'
    ) b;

    -- 5. Trends
    SELECT jsonb_agg(t) INTO v_trends FROM (
        SELECT
            DATE_TRUNC('month', e.enrolled_at) as month,
            COUNT(*) as enrollments,
            COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completions,
            ROUND(COUNT(CASE WHEN e.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
        FROM public.enrollments e
        WHERE e.enrolled_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', e.enrolled_at)
        ORDER BY month DESC
        LIMIT 12
    ) t;

    -- Combine all into a single JSON object
    v_result := jsonb_build_object(
        'performance', v_performance,
        'publicStats', v_public_stats,
        'courseAverages', v_course_averages,
        'benchmarks', v_benchmarks,
        'trends', v_trends
    );

    RETURN v_result;
END;
$function$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_course_gradebook(p_course_id INT)
RETURNS JSONB AS $function$
DECLARE
    v_gradebook_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'course', (SELECT to_jsonb(c) FROM courses c WHERE c.id = p_course_id),
        'tasks', (
            SELECT jsonb_agg(t.* ORDER BY t.due_date ASC)
            FROM tasks t
            WHERE t.schedule_id IN (SELECT id FROM course_schedule WHERE course_id = p_course_id)
        ),
        'students', (
            SELECT jsonb_agg(u.* ORDER BY u.full_name ASC)
            FROM users u
            JOIN enrollments e ON u.id = e.user_id
            WHERE e.course_id = p_course_id AND u.role = 'student'
        ),
        'submissions', (
            SELECT jsonb_agg(s.*)
            FROM submissions s
            JOIN tasks t ON s.task_id = t.id
            WHERE t.schedule_id IN (SELECT id FROM course_schedule WHERE course_id = p_course_id)
        )
    )
    INTO v_gradebook_data;

    RETURN v_gradebook_data;
END;
$function$ LANGUAGE plpgsql;
