// Script to fix TODO notification logic in payment and course approval files
const fs = require('fs');

// Fix payment confirmation notification
const paymentConfirmFile = 'pages/api/payments/[id]/confirm.js';
if (fs.existsSync(paymentConfirmFile)) {
  let content = fs.readFileSync(paymentConfirmFile, 'utf8');
  
  // Add notification logic after payment status update
  const todoPattern = /\/\/ TODO: Add notification logic here to inform the user about the payment confirmation\/rejection/;
  
  if (todoPattern.test(content)) {
    const notificationCode = `
        // Send notification to user about payment status
        const enrollmentResult = await pool.query(
            \`SELECT e.user_id, c.name as course_name 
             FROM enrollments e 
             JOIN courses c ON e.course_id = c.id 
             WHERE e.id = $1\`,
            [enrollmentId]
        );

        if (enrollmentResult.rows.length > 0) {
            const { user_id, course_name } = enrollmentResult.rows[0];
            const message = status === 'paid' 
                ? \`تم تأكيد دفعتك للدورة: \${course_name}\` 
                : \`تم رفض دفعتك للدورة: \${course_name}. \${notes || 'يرجى المراجعة مع الإدارة'}\`;
            
            await pool.query(
                \`INSERT INTO notifications (user_id, type, message, link, created_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)\`,
                [user_id, 'payment_reminder', message, '/finance']
            );
        }`;
    
    content = content.replace(todoPattern, notificationCode);
    fs.writeFileSync(paymentConfirmFile, content);
    console.log('Fixed payment confirmation notifications');
  }
}

// Fix course approval notification
const courseApprovalFile = 'pages/api/courses/[id]/approve.js';
if (fs.existsSync(courseApprovalFile)) {
  let content = fs.readFileSync(courseApprovalFile, 'utf8');
  
  const todoPattern = /\/\/ TODO: Add notification logic here to inform the course creator of the approval\/rejection/;
  
  if (todoPattern.test(content)) {
    const notificationCode = `
        // Send notification to course creator about approval status
        const courseResult = await pool.query(
            'SELECT created_by, name FROM courses WHERE id = $1',
            [courseId]
        );

        if (courseResult.rows.length > 0) {
            const { created_by, name } = courseResult.rows[0];
            const message = status === 'approved' 
                ? \`تم قبول دورتك: \${name}\` 
                : \`تم رفض دورتك: \${name}. \${notes || 'يرجى المراجعة مع الإدارة'}\`;
            
            await pool.query(
                \`INSERT INTO notifications (user_id, type, message, link, created_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)\`,
                [created_by, 'announcement', message, \`/courses/\${courseId}\`]
            );
        }`;
    
    content = content.replace(todoPattern, notificationCode);
    fs.writeFileSync(courseApprovalFile, content);
    console.log('Fixed course approval notifications');
  }
}

console.log('Notification TODO fixes completed!');