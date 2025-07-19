import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const parentId = decoded.id;
    const { fullName, email, phone, password, details } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'الرجاء ملء جميع الحقول الإلزامية.' });
    }

    // Ensure the parent is actually a parent role (optional but good practice)
    const parentCheck = await pool.query('SELECT role FROM users WHERE id = $1', [parentId]);
    if (parentCheck.rows.length === 0 || parentCheck.rows[0].role !== 'parent') {
      return res.status(403).json({ message: 'غير مصرح لك بإضافة مستخدمين.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create the child user with 'student' role
    const newChild = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [fullName, email, phone, password_hash, 'student', details || {}]
    );

    // Establish parent-child relationship
    await pool.query(
      'INSERT INTO parent_child_relationships (parent_id, child_id) VALUES ($1, $2)',
      [parentId, newChild.rows[0].id]
    );

    res.status(201).json({ message: 'تم إضافة الابن بنجاح!' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل.' });
    }
    console.error("Add Child Error:", err);
    res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
}
