import pool from './db';
import cron from 'node-cron';

const TZ = 'Africa/Cairo';

const dayNameToIndex = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function parseDays(daysCsv) {
  return daysCsv.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
}

function cairoParts(date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  });
  const parts = fmt.formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const weekdayMap = { Sun:'sun', Mon:'mon', Tue:'tue', Wed:'wed', Thu:'thu', Fri:'fri', Sat:'sat' };
  return {
    year: parseInt(map.year),
    month: parseInt(map.month),
    day: parseInt(map.day),
    weekday: weekdayMap[map.weekday]
  };
}
function getTzOffsetMinutes(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
  const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
  return (local.getTime() - d.getTime()) / 60000;
}
function makeCairoDateTimeUTC(y,m,d,hh,mm) {
  // Creates a UTC Date that corresponds to Cairo local y-m-d hh:mm
  const baseUTC = new Date(Date.UTC(y, m-1, d, hh, mm, 0));
  const offset = getTzOffsetMinutes(baseUTC);
  return new Date(baseUTC.getTime() - offset*60000);
}
function nextNDatesOnDays(startDate, days, n, publishTime) {
  const results = [];
  const [hh, mm] = publishTime.split(':').map(Number);
  const start = startDate ? new Date(startDate) : new Date();
  for (let i = 0; i < 120 && results.length < n; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const cp = cairoParts(d);
    if (days.includes(cp.weekday)) {
      const occ = makeCairoDateTimeUTC(cp.year, cp.month, cp.day, hh, mm);
      results.push(occ);
    }
  }
  return results;
}

async function generateOccurrencesForTeacherCourse(teacherId, courseId) {
  // load schedule and templates
  const { rows: schedules } = await pool.query(
    `SELECT * FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2 AND is_paused=false`,
    [teacherId, courseId]
  );
  if (schedules.length === 0) return 0;
  const schedule = schedules[0];
  const days = parseDays(schedule.days);

  // load templates
  const { rows: templates } = await pool.query(
    `SELECT * FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2 AND active=true`,
    [teacherId, courseId]
  );

  let created = 0;
  for (const tpl of templates) {
    const start = tpl.start_date ? new Date(tpl.start_date) : new Date();
    const end = tpl.end_date ? new Date(tpl.end_date) : null;
    const occurrences = nextNDatesOnDays(start, days, 28, schedule.publish_time);

    for (const publishAt of occurrences) {
      if (end && publishAt > new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23,59,59))) continue;

      // skip if exists
      const exists = await pool.query(
        `SELECT 1 FROM assignment_occurrences WHERE template_id=$1 AND publish_at=$2`,
        [tpl.id, publishAt]
      );
      if (exists.rows.length > 0) continue;

      const overlap = await pool.query(
        `SELECT overlaps_holidays(holidays, $1) as overlap FROM teacher_schedules WHERE teacher_id=$2 AND course_id=$3`,
        [publishAt, teacherId, courseId]
      );
      const isHoliday = overlap.rows[0]?.overlap === true;
      const status = isHoliday ? 'skipped-holiday' : 'scheduled';

      await pool.query(
        `INSERT INTO assignment_occurrences (template_id, publish_at, status) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [tpl.id, publishAt, status]
      );
      created++;
    }
  }
  return created;
}

async function postDueOccurrences() {
  const now = new Date();
  const { rows } = await pool.query(
    `SELECT o.id, o.template_id, o.publish_at, t.course_id, t.title, t.description
     FROM assignment_occurrences o
     JOIN assignment_templates t ON o.template_id = t.id
     WHERE o.status='scheduled' AND o.publish_at <= NOW()`
  );

  for (const occ of rows) {
    // Create task or assignment in existing tasks table if present
    try {
      await pool.query('BEGIN');
      await pool.query(
        `INSERT INTO tasks (title, description, course_id, type, due_date, created_at)
         VALUES ($1,$2,$3,'homework', $4, NOW())`,
        [occ.title, occ.description || '', occ.course_id, occ.publish_at]
      );
      await pool.query(`UPDATE assignment_occurrences SET status='posted' WHERE id=$1`, [occ.id]);
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      console.error('Posting occurrence failed', e);
    }
  }
}

class AssignmentsScheduler {
  constructor() {
    this.started = false;
  }
  start() {
    if (this.started) return;
    // Every hour generate next 4 weeks
    cron.schedule('0 * * * *', async () => {
      try {
        const { rows: teacherCourses } = await pool.query(`
          SELECT DISTINCT teacher_id, course_id FROM teacher_schedules WHERE is_paused=false
        `);
        for (const tc of teacherCourses) {
          await generateOccurrencesForTeacherCourse(tc.teacher_id, tc.course_id);
        }
      } catch (e) { console.error(e); }
    }, { timezone: TZ });

    // Every 5 minutes post due ones
    cron.schedule('*/5 * * * *', async () => {
      try { await postDueOccurrences(); } catch (e) { console.error(e); }
    }, { timezone: TZ });

    this.started = true;
    console.log('AssignmentsScheduler started');
  }
}

const assignmentsScheduler = new AssignmentsScheduler();
export default assignmentsScheduler;
export { generateOccurrencesForTeacherCourse, postDueOccurrences };
