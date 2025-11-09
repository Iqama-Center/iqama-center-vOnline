import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import errorHandler from '../../../lib/errorHandler';
import { validateEmail, validatePhone } from '../../../lib/validation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Expect snake_case keys from the frontend
  const { full_name, email, phone, password, role, details } = req.body;

  // Enhanced server-side validation
  if (!full_name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'الرجاء ملء جميع الحقول الإلزامية.' });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return res.status(400).json({ message: emailError });
  }

  const phoneError = validatePhone(phone);
  if (phoneError) {
    return res.status(400).json({ message: phoneError });
  }

  const allowedPublicRoles = ['student', 'parent', 'worker'];
  if (!allowedPublicRoles.includes(role)) {
    return res.status(403).json({ message: 'لا يمكن إنشاء هذا النوع من الحسابات عبر التسجيل العام. يرجى التواصل مع الإدارة.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // The details object now comes pre-formatted with snake_case keys from the frontend
    const dbDetails = {
        ...details,
        registration_status: 'active',
        registration_date: new Date().toISOString()
    };

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' });
    }

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [full_name, email, phone, password_hash, role, dbDetails]
    );

    const userId = newUser.rows[0].id;

    res.status(201).json({ 
      message: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.',
      userId: userId
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') { // unique_violation
      if (err.constraint === 'users_email_key') {
        return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل.' });
      }
      return res.status(400).json({ message: 'البيانات مسجلة بالفعل.' });
    }
    errorHandler(err, res);
  }
}
