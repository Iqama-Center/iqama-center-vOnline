import pool from '../../../lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res){
  if(req.method!=='POST') return res.status(405).json({message:'Method Not Allowed'});
  try {
    const sqlPath = path.join(process.cwd(), 'تعليمات', 'assignments_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
