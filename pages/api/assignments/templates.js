import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!['teacher','admin','head'].includes(decoded.role)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (req.method === 'GET') {
    const { courseId } = req.query;
    const { rows } = await pool.query('SELECT * FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2 ORDER BY created_at DESC', [decoded.id, courseId]);
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { courseId, title, description, attachments, active, startDate, endDate } = req.body;
    if (!courseId || !title) return res.status(400).json({ message: 'Missing fields' });
    const result = await pool.query(`
      INSERT INTO assignment_templates (teacher_id, course_id, title, description, attachments, active, start_date, end_date)
      VALUES ($1,$2,$3,$4,COALESCE($5,'[]'),COALESCE($6,true),$7,$8)
      RETURNING *
    `, [decoded.id, courseId, title, description || '', JSON.stringify(attachments||[]), active !== false, startDate || null, endDate || null]);
    return res.status(201).json(result.rows[0]);
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [k,v] of Object.entries(updates)) {
      fields.push(`${k}=$${idx++}`);
      if (k === 'attachments') values.push(JSON.stringify(v||[])); else values.push(v);
    }
    values.push(id, decoded.id);
    const sql = `UPDATE assignment_templates SET ${fields.join(',')}, updated_at=NOW() WHERE id=$${idx++} AND teacher_id=$${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return res.status(200).json(rows[0] || null);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
