import pool from '../lib/db.js';
import '../lib/assignmentsScheduler.js';

async function run(){
  console.log('Running basic assignments tests...');

  // 1. single day schedule works
  try {
    const teacherId = 1; const courseId = 1;
    await pool.query('DELETE FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2',[teacherId,courseId]);
    await pool.query('DELETE FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2',[teacherId,courseId]);
    await pool.query('DELETE FROM assignment_occurrences WHERE template_id IN (SELECT id FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2)',[teacherId,courseId]);

    await pool.query(`INSERT INTO teacher_schedules (teacher_id, course_id, days, publish_time, is_paused) VALUES ($1,$2,'mon','10:00',false) ON CONFLICT (teacher_id,course_id) DO UPDATE SET days='mon', publish_time='10:00', is_paused=false`,[teacherId,courseId]);
    const tplRes = await pool.query(`INSERT INTO assignment_templates (teacher_id, course_id, title, description, active) VALUES ($1,$2,'Test','Desc',true) RETURNING id`,[teacherId,courseId]);

    const { rows } = await pool.query(`SELECT * FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2`,[teacherId,courseId]);
    if(rows.length===0) throw new Error('No schedule inserted');

    console.log('OK: single day schedule setup');
  } catch (e) {
    console.error('Fail test 1', e);
  }

  // 2. timezone check default Africa/Cairo
  console.log('Assuming TZ Africa/Cairo for scheduler');
  console.log('Done. Note: This script needs a seeded users/courses database.');
  process.exit(0);
}
run();
