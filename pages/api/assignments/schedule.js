import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

import { generateOccurrencesForTeacherCourse } from '../../../lib/assignmentsScheduler';

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
    const { rows } = await pool.query('SELECT * FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2', [decoded.id, courseId]);
    return res.status(200).json(rows[0] || null);
  }

  if (req.method === 'POST') {
    const { courseId, days, publishTime, isPaused, holidays } = req.body;
    if (!courseId || !days || !publishTime) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const result = await pool.query(`
      INSERT INTO teacher_schedules (teacher_id, course_id, days, publish_time, is_paused, holidays, updated_at)
      VALUES ($1,$2,$3,$4,COALESCE($5,false),COALESCE($6,'{}'), NOW())
      ON CONFLICT (teacher_id, course_id) DO UPDATE SET
        days=EXCLUDED.days,
        publish_time=EXCLUDED.publish_time,
        is_paused=EXCLUDED.is_paused,
        holidays=EXCLUDED.holidays,
        updated_at=NOW()
      RETURNING *
    `, [decoded.id, courseId, days, publishTime, isPaused, holidays]);
    const saved=result.rows[0];
    // refresh preview occurrences without duplicates
    try { await generateOccurrencesForTeacherCourse(decoded.id, courseId); } catch (e) { console.error('gen occ error', e); }
    return res.status(200).json(saved);
  }

  if (req.method === 'PATCH') {
    const { courseId, isPaused } = req.body;
    if (!courseId) return res.status(400).json({ message: 'Missing courseId' });
    const { rows } = await pool.query(`
      UPDATE teacher_schedules SET is_paused=$1, updated_at=NOW() WHERE teacher_id=$2 AND course_id=$3 RETURNING *
    `, [!!isPaused, decoded.id, courseId]);
    return res.status(200).json(rows[0] || null);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
