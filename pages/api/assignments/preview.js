import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

function parseDays(daysCsv){return daysCsv.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)}
function nextNDatesOnDays(startDate, days, n, publishTime){
  const results=[];const [hh,mm]=publishTime.split(':').map(Number);
  const start=new Date(startDate||new Date());
  for(let i=0;i<120 && results.length<n;i++){
    const d=new Date(start.getTime()+i*24*60*60*1000);
    const dow=d.getUTCDay();const names=['sun','mon','tue','wed','thu','fri','sat'];const name=names[dow];
    if(days.includes(name)){
      const occ=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),hh,mm,0));
      results.push(occ);
    }
  }
  return results;
}

export default async function handler(req, res){
  const cookies=parse(req.headers.cookie||'');
  const token=cookies.token; if(!token) return res.status(401).json({message:'Not authenticated'});
  const decoded=jwt.verify(token, process.env.JWT_SECRET);
  if(!['teacher','admin','head'].includes(decoded.role)) return res.status(403).json({message:'Not authorized'});

  const { courseId } = req.query;
  const { rows: srows } = await pool.query('SELECT * FROM teacher_schedules WHERE teacher_id=$1 AND course_id=$2', [decoded.id, courseId]);
  if(srows.length===0) return res.status(200).json([]);
  const schedule=srows[0];
  const days=parseDays(schedule.days);
  const { rows: tpls } = await pool.query('SELECT * FROM assignment_templates WHERE teacher_id=$1 AND course_id=$2 AND active=true', [decoded.id, courseId]);

  let preview=[];
  for(const tpl of tpls){
    const start=tpl.start_date? new Date(tpl.start_date): new Date();
    const end=tpl.end_date? new Date(tpl.end_date): null;
    const occs=nextNDatesOnDays(start, days, 28, schedule.publish_time);
    for(const publishAt of occs){
      if(end && publishAt> new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),end.getUTCDate(),23,59,59))) continue;
      const { rows: overlapRows } = await pool.query('SELECT overlaps_holidays(holidays,$1) as overlap FROM teacher_schedules WHERE teacher_id=$2 AND course_id=$3',[publishAt, decoded.id, courseId]);
      const overlap=overlapRows[0]?.overlap===true;
      preview.push({ templateId: tpl.id, title: tpl.title, publishAt, status: overlap? 'skipped-holiday':'scheduled'});
    }
  }
  preview.sort((a,b)=> new Date(a.publishAt)- new Date(b.publishAt));
  res.status(200).json(preview);
}
