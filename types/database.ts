// TypeScript interfaces for JSONB field structures
// This file defines the expected structure of JSONB fields in the database

export interface CourseDetails {
  cost?: number;
  currency?: string;
  max_seats?: number;
  duration_weeks?: number;
  price?: number;
  target_age?: string;
  target_roles?: string[];
  course_type?: string;
  is_worker_development?: boolean;
  prerequisites?: number[];
  meeting_link?: string;
  first_day_content?: string;
  current_rating?: number;
  rating_count?: number;
  teachers?: number[];
}

export interface UserDetails {
  gender?: string;
  birth_date?: string;
  nationality?: string;
  languages?: string[];
  parent_notes?: string;
  is_payment_locked?: boolean;
  workerSpecializations?: string[];
  // Legacy field - should be migrated to parent_child_relationships table
  parent_id?: number;
}

export interface EnrollmentGrade {
  final_score?: number;
  assignments?: {
    [assignmentId: string]: {
      score: number;
      submitted_at: string;
      graded_at?: string;
    };
  };
  exams?: {
    [examId: string]: {
      score: number;
      attempts: number;
      best_attempt: number;
      completed_at: string;
    };
  };
  attendance?: {
    total_sessions: number;
    attended_sessions: number;
    attendance_percentage: number;
  };
}

export interface CourseAutoLaunchSettings {
  auto_launch_on_max_capacity?: boolean;
  auto_launch_on_optimal_capacity?: boolean;
  auto_launch_on_min_capacity?: boolean;
  days_before_start?: number;
  notification_settings?: {
    notify_participants?: boolean;
    notify_admins?: boolean;
  };
}

export interface CourseParticipantConfig {
  levels?: {
    [levelNumber: string]: {
      level_name: string;
      target_roles: string[];
      min_count: number;
      max_count: number;
      optimal_count: number;
    };
  };
}

export interface CourseTemplateData {
  pricing?: {
    cost: number;
    currency: string;
  };
  daily_content_template?: {
    [dayNumber: string]: {
      title: string;
      content: string;
      assignments?: string[];
      resources?: string[];
    };
  };
  participant_config?: CourseParticipantConfig;
  auto_fill_template?: {
    meeting_link_template?: string;
    content_url_template?: string;
    url_numbering_start?: number;
    url_numbering_end?: number;
    default_assignments?: any[];
  };
  launch_settings?: CourseAutoLaunchSettings;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

// Database table interfaces
export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'student' | 'parent' | 'teacher' | 'worker' | 'head' | 'finance' | 'admin';
  reports_to?: number;
  created_at: string;
  details: UserDetails;
  avatar_url?: string;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  details: CourseDetails;
  status: string;
  approved_by?: number;
  approved_at?: string;
  template_id?: number;
  current_enrollment: number;
  min_enrollment: number;
  max_enrollment: number;
  duration_days: number;
  start_date?: string;
  days_per_week: number;
  hours_per_day: number;
  content_outline?: string;
  auto_launch_settings: CourseAutoLaunchSettings;
  participant_config: CourseParticipantConfig;
  is_published: boolean;
  is_launched: boolean;
  launched_at?: string;
  launch_date?: string;
}

export interface Exam {
  id: number;
  course_id: number;
  day_number: number;
  title: string;
  description?: string;
  questions: ExamQuestion[];
  time_limit: number;
  max_attempts: number;
  passing_score: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  status: 'pending_payment' | 'waiting_start' | 'active' | 'completed' | 'cancelled' | 'pending_approval';
  enrolled_at: string;
  grade?: EnrollmentGrade;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'new_task' | 'payment_reminder' | 'meeting_reminder' | 'message' | 'announcement' | 'course_published' | 'course_launched' | 'course_enrollment' | 'course_approval_needed' | 'course_auto_launched' | 'course_message';
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  related_type?: string;
  title?: string;
  content?: string;
  related_id?: number;
}

export interface Payment {
  id: number;
  enrollment_id: number;
  amount: number;
  currency: string;
  due_date: string;
  status: 'due' | 'paid' | 'late' | 'waived' | 'pending_review';
  payment_proof_url?: string;
  paid_at?: string;
  confirmed_by?: number;
  notes?: string;
}

export interface ParentChildRelationship {
  parent_id: number;
  child_id: number;
  created_at?: string;
}