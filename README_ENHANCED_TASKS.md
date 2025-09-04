# Enhanced Task Management System - إضافة المهام

## Overview
This implementation adds a comprehensive task management system to the course creation flow with support for both daily tasks (24-hour expiry) and fixed tasks (custom deadlines).

## Features Added

### 1. Enhanced Task Configuration in Course Creation
- **Location**: `components/CourseCreationForm.js`
- **New Section**: "إضافة المهام التلقائية" with toggle to enable/disable
- **Task Types**:
  - **Daily Tasks (المهام اليومية)**: Expire after 24 hours with automatic grade reduction
  - **Fixed Tasks (المهام الثابتة)**: Custom deadlines with priority levels

### 2. Task Categories by User Role

#### Students (الطلاب - Level 3)
**Daily Tasks:**
- قراءة يومية (Daily Reading)
- اختبار يومي (Daily Quiz)
- ورد يومي (Daily Wird)

**Fixed Tasks:**
- واجب منزلي (Homework)
- مشروع تطبيقي (Project)

#### Teachers (المعلمين - Level 2)
**Daily Tasks:**
- تقييم الطلاب (Student Evaluation)
- تسجيل الحضور (Attendance Record)

**Fixed Tasks:**
- تحضير الدرس (Lesson Preparation)
- تصحيح الواجبات (Grading)

#### Supervisors (المشرفين - Level 1)
**Daily Tasks:**
- مراقبة يومية (Daily Monitoring)

**Fixed Tasks:**
- مراجعة الأداء (Performance Review)
- متابعة التواصل (Communication Follow-up)

### 3. Database Enhancements

#### New Columns in `tasks` table:
- `task_category`: 'daily' or 'fixed'
- `expires_in_hours`: For daily tasks (default 24)
- `auto_grade_reduction`: Percentage reduction for late daily tasks
- `custom_deadline`: Custom deadline for fixed tasks
- `priority_level`: 'low', 'medium', 'high'
- `activated_at`: When daily tasks become active
- `expired_at`: When daily tasks expire
- `score`: Task grade/score

#### New Columns in `course_task_templates` table:
- `task_category`: Template category
- `expires_in_hours`: Template expiry hours
- `auto_grade_reduction`: Template grade reduction
- `custom_deadline_days`: Days until deadline for fixed tasks
- `priority_level`: Template priority

### 4. Enhanced Task Generator
- **File**: `lib/enhancedTaskGenerator.js`
- **Functions**:
  - `generateEnhancedTasksForCourse()`: Main task generation
  - `activateDailyTasks()`: Activate daily tasks when course day starts
  - `expireDailyTasks()`: Check and expire overdue daily tasks

### 5. API Endpoints

#### New Endpoints:
- `POST /api/tasks/activate-daily`: Activate daily tasks for a course schedule
- `POST /api/tasks/expire-daily`: Check and expire overdue daily tasks (for cron jobs)

#### Enhanced Endpoint:
- `POST /api/courses/create-with-tasks`: Now supports enhanced task configuration

### 6. Database Functions and Triggers

#### Functions:
- `auto_activate_daily_tasks()`: Automatically activate daily tasks when course day starts
- `expire_overdue_daily_tasks()`: Check and expire overdue daily tasks

#### Triggers:
- `trigger_auto_activate_daily_tasks`: Triggers when `course_schedule.tasks_released` is set to true

#### Views:
- `task_dashboard`: Comprehensive view of all tasks with time remaining calculations

## Usage Instructions

### 1. Database Setup
Run the setup script to add new columns and functions:
```sql
-- Run this file on your database
\i scripts/setup-enhanced-tasks.sql
```

### 2. Course Creation with Tasks
1. Navigate to `/admin/courses/new`
2. Fill in basic course information
3. In the "الملء التلقائي" section, enable "تفعيل توليد المهام التلقائي"
4. Configure tasks for each level:
   - Choose task category (daily/fixed)
   - Select task type
   - Set title, description, and instructions
   - Configure specific settings:
     - **Daily tasks**: Grade reduction percentage
     - **Fixed tasks**: Days until deadline and priority level

### 3. Task Lifecycle

#### Daily Tasks:
1. **Created**: When course is created with task generation enabled
2. **Scheduled**: Initial status, waiting for course day to start
3. **Active**: Activated when course day starts (24-hour timer begins)
4. **Completed**: When user submits the task
5. **Expired**: After 24 hours if not completed (with grade reduction)

#### Fixed Tasks:
1. **Created**: When course is created
2. **Scheduled**: Initial status
3. **Active**: Available for completion
4. **Completed**: When user submits before deadline
5. **Overdue**: After custom deadline passes

### 4. Notifications
The system automatically sends notifications for:
- Task scheduled
- Daily task activated (24-hour timer starts)
- Daily task expired (with grade reduction notice)
- Fixed task deadline approaching
- Task completion confirmations

### 5. Monitoring and Management
- Use the `task_dashboard` view to monitor all tasks
- Check task status, time remaining, and priority levels
- Track completion rates and grade reductions

## Configuration Options

### Daily Tasks:
- **Expiry Time**: Default 24 hours (configurable)
- **Grade Reduction**: 0-100% for late completion
- **Auto-activation**: When course day starts

### Fixed Tasks:
- **Custom Deadlines**: 1-30 days from course day
- **Priority Levels**: Low, Medium, High
- **Flexible Scheduling**: Can be set relative to course schedule

## Integration Points

### With Existing Systems:
- **Course Creation**: Seamlessly integrated into existing flow
- **User Roles**: Respects existing role-based permissions
- **Notifications**: Uses existing notification system
- **Database**: Extends existing schema without breaking changes

### Future Enhancements:
- Mobile app notifications for task deadlines
- Advanced analytics and reporting
- Bulk task management tools
- Integration with external learning management systems

## Technical Notes

### Performance Considerations:
- Indexed columns for fast queries
- Efficient task expiry checking
- Optimized notification generation

### Security:
- Role-based task access
- Secure API endpoints
- Input validation and sanitization

### Scalability:
- Designed for large numbers of courses and users
- Efficient database queries
- Modular architecture for easy extension

## Troubleshooting

### Common Issues:
1. **Tasks not activating**: Check if `course_schedule.tasks_released` is set to true
2. **Grade reductions not applying**: Verify `auto_grade_reduction` values are set correctly
3. **Notifications not sending**: Check notification service configuration

### Monitoring:
- Use `task_dashboard` view for comprehensive task monitoring
- Check database logs for task generation errors
- Monitor API endpoint response times

## Support
For technical support or feature requests, please refer to the development team or create an issue in the project repository.