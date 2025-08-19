import pool from '../../../lib/db';

export default async function handler(req, res){
  if(req.method!=='GET') return res.status(405).json({message:'Method Not Allowed'});
  const { courseId } = req.query;
  const { rows } = await pool.query(`
    SELECT o.id, t.title, t.description, o.publish_at, o.status
    FROM assignment_occurrences o
    JOIN assignment_templates t ON o.template_id = t.id
    WHERE t.course_id = $1 AND (o.status='scheduled' OR o.status='posted')
    ORDER BY o.publish_at ASC
  `, [courseId]);
  res.status(200).json(rows);
}
