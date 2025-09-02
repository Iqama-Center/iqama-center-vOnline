# Automated Task Generation System

## Overview

This system automatically generates and manages tasks for courses, handling both daily tasks (24-hour expiry) and fixed tasks with specific deadlines. Tasks are assigned to students, teachers, and supervisors based on their roles and are linked to scheduled meetings.

## Features

### 1. Automatic Task Generation
- **Course Creation Integration**: Tasks are automatically generated when a course is created with a schedule
- **Role-Based Tasks**: Different task types for students, teachers, and supervisors
- **Meeting-Linked**: Tasks are tied to scheduled course meetings and released when meetings end

### 2. Task Types

#### Daily Tasks (24-hour expiry)
- **Daily Reading** (Students): Must be completed within 24 hours
- **Daily Quiz** (Students): Short quiz with 24-hour deadline
- **Daily Evaluation** (Teachers): Evaluate student performance daily
- **Daily Monitoring** (Supervisors): Monitor course progress daily

#### Fixed Tasks (Specific deadlines)
- **Homework** (Students): 3-day deadline
- **Exams** (Students): 1-week deadline
- **Weekly Reports** (Teachers): 3-day deadline after week end
- **Weekly Evaluations** (Supervisors): 1-week deadline

### 3. Automated Scheduling
- **Task Release**: Tasks are released automatically when meeting times pass
- **Deadline Monitoring**: System tracks deadlines and applies penalties
- **Notifications**: Automatic notifications for task releases, deadlines, and penalties

### 4. Grade Management
- **Automatic Penalties**: Grade reductions for late or missed tasks
- **Performance Tracking**: Real-time performance updates
- **Score Calculation**: Automatic scoring with late penalties

## System Components

### 1. Task Generation API
**File**: `pages/api/courses/generate-tasks.js`
- Generates tasks for all enrolled users when course is launched
- Creates role-specific tasks based on course schedule
- Calculates appropriate due dates for each task type

### 2. Task Scheduler
**File**: `lib/taskScheduler.js`
- Runs automated cron jobs for task management
- Releases tasks when meeting times pass
- Processes expired and overdue tasks
- Sends deadline reminders
- Applies grade penalties

### 3. Task Submission API
**File**: `pages/api/tasks/submit.js`
- Handles task submissions from users
- Calculates scores with late penalties
- Updates user performance metrics
- Sends notifications to instructors

### 4. Task Management Component
**File**: `components/TaskManagement.js`
- User interface for viewing and submitting tasks
- Filters for different task types and statuses
- Real-time deadline tracking
- Submission interface for students

### 5. Database Tables

#### Tasks Table
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES course_schedule(id),
    task_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to INTEGER REFERENCES users(id),
    level_number INTEGER,
    is_active BOOLEAN DEFAULT false,
    released_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    max_score NUMERIC(5,2) DEFAULT 100,
    instructions TEXT,
    status VARCHAR(50) DEFAULT 'pending'
);
```

#### Task Submissions Table
```sql
CREATE TABLE task_submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    submission_content TEXT,
    submission_type VARCHAR(50) DEFAULT 'text',
    status VARCHAR(50) DEFAULT 'submitted',
    score NUMERIC(5,2),
    score_reduction NUMERIC(5,2) DEFAULT 0,
    is_late BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by INTEGER REFERENCES users(id),
    feedback TEXT
);
```

#### Task Penalties Table
```sql
CREATE TABLE task_penalties (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    penalty_percentage NUMERIC(5,2) NOT NULL,
    penalty_reason TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Task Flow

### 1. Course Creation
1. Admin/Head creates course with schedule
2. Course schedule is automatically generated
3. Course is launched
4. Task generation API is called
5. Tasks are created for all enrolled users

### 2. Task Release
1. Scheduler monitors meeting times
2. When meeting ends, tasks for that day are activated
3. Notifications sent to assigned users
4. Tasks become available for submission

### 3. Task Submission
1. Users view available tasks in TaskManagement component
2. Students submit tasks through the interface
3. System calculates scores and applies late penalties
4. Performance metrics are updated
5. Instructors are notified of submissions

### 4. Deadline Management
1. Scheduler monitors task deadlines
2. Sends reminder notifications 24 hours before deadline
3. Processes expired daily tasks (applies penalties)
4. Processes overdue fixed tasks (applies penalties)
5. Updates task status and user grades

## Penalty System

### Daily Tasks
- **50% penalty** for late submission
- **100% penalty** for no submission (expired)

### Fixed Tasks
- **Homework**: 20% penalty for late submission
- **Exams**: 30% penalty for late submission
- **Reports**: 10% penalty for late submission

## Notification Types

1. **task_released**: Task is now available
2. **deadline_reminder**: 24-hour deadline warning
3. **task_completed**: Task successfully submitted
4. **penalty_applied**: Grade penalty applied
5. **student_submission**: Instructor notification of student submission

## Configuration

### Environment Variables
- `CRON_SECRET`: Secret for internal cron job authentication
- `NEXT_PUBLIC_BASE_URL`: Base URL for internal API calls

### Scheduler Settings
- **Task Release Check**: Every 5 minutes
- **Expiry Processing**: Every hour
- **Deadline Reminders**: Every 6 hours
- **Overdue Processing**: Daily at midnight

## Usage Examples

### For Students
```javascript
// View tasks
<TaskManagement userRole="student" userId={userId} courseId={courseId} />

// Submit task
await fetch('/api/tasks/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        taskId: 123,
        submission_content: "My submission content",
        submission_type: "text"
    })
});
```

### For Teachers
```javascript
// View all course tasks
<TaskManagement userRole="teacher" userId={userId} courseId={courseId} />

// Generate tasks for course
await fetch('/api/courses/generate-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: 123 })
});
```

## Integration Points

### Course Creation
- Modified `pages/api/courses/create-advanced.js` to generate course schedule
- Updated `pages/api/courses/[id]/launch.js` to trigger task generation

### Application Startup
- Modified `pages/_app.js` to start task scheduler on server startup

### Dashboard Integration
- TaskManagement component can be integrated into user dashboards
- Supports filtering by task type, status, and course

## Monitoring and Maintenance

### Logs
- Task generation logs in course launch
- Scheduler operation logs every execution
- Error logs for failed operations

### Performance Considerations
- Indexed database queries for efficient task retrieval
- Batch processing for penalty applications
- Optimized notification creation

### Backup and Recovery
- All task data stored in relational database
- Penalties and submissions are tracked separately
- System can regenerate tasks if needed

## Future Enhancements

1. **File Attachments**: Support for file submissions
2. **Peer Review**: Student-to-student task reviews
3. **Advanced Scheduling**: Custom task schedules per course
4. **Analytics Dashboard**: Task completion analytics
5. **Mobile Notifications**: Push notifications for mobile apps
6. **Automated Grading**: AI-powered task grading
7. **Task Templates**: Reusable task templates for courses