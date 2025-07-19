import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { enrollmentId, finalGrade } = req.body;

        if (!enrollmentId || !finalGrade) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Get enrollment details
        const enrollment = await pool.query(
            `SELECT e.*, u.full_name, u.email, c.name as course_name, c.details as course_details
             FROM enrollments e
             JOIN users u ON e.user_id = u.id
             JOIN courses c ON e.course_id = c.id
             WHERE e.id = $1 AND e.status = 'completed'`,
            [enrollmentId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ message: 'Completed enrollment not found' });
        }

        const enrollmentData = enrollment.rows[0];

        // Check if certificate already exists
        const existingCert = await pool.query(
            'SELECT id FROM certificates WHERE enrollment_id = $1',
            [enrollmentId]
        );

        if (existingCert.rows.length > 0) {
            return res.status(400).json({ message: 'Certificate already exists for this enrollment' });
        }

        // Generate unique certificate code
        const certificateCode = generateCertificateCode(enrollmentData.full_name, enrollmentData.course_name);

        // Create certificate record
        const newCertificate = await pool.query(
            `INSERT INTO certificates (enrollment_id, certificate_code, grade, issue_date)
             VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *`,
            [enrollmentId, certificateCode, finalGrade]
        );

        // Update enrollment with final grade
        await pool.query(
            'UPDATE enrollments SET grade = $1 WHERE id = $2',
            [JSON.stringify({ final_grade: finalGrade, certificate_issued: true }), enrollmentId]
        );

        // Notify the student
        await NotificationService.createNotification(
            [enrollmentData.user_id],
            'announcement',
            `تهانينا! تم إصدار شهادتك لدورة ${enrollmentData.course_name}`,
            `/certificates/${certificateCode}`
        );

        res.status(201).json({
            message: 'تم إصدار الشهادة بنجاح',
            certificate: newCertificate.rows[0],
            certificateCode
        });

    } catch (err) {
        console.error('Certificate generation error:', err);
        errorHandler(err, res);
    }
}

function generateCertificateCode(studentName, courseName) {
    const timestamp = Date.now().toString(36);
    const nameHash = studentName.split(' ')[0].substring(0, 3).toUpperCase();
    const courseHash = courseName.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `IQC-${nameHash}${courseHash}-${timestamp}-${randomSuffix}`;
}