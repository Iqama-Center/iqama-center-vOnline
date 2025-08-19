import React, { useEffect, useState } from 'react';
import AssignmentsSchedulerSettings from '../../components/AssignmentsSchedulerSettings';
import AssignmentTemplateForm from '../../components/AssignmentTemplateForm';

export default function TeacherAssignmentsPage(){
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState([]);

  useEffect(()=>{
    async function load(){
      const res = await fetch('/api/teacher/courses');
      if(res.ok){ const data = await res.json(); setCourses(data); if(data.length) setCourseId(data[0].id); }
    }
    load();
  },[]);

  useEffect(()=>{
    async function loadTemplates(){
      if(!courseId) return;
      const res = await fetch(`/api/assignments/templates?courseId=${courseId}`);
      if(res.ok){ setTemplates(await res.json()); }
      const res2 = await fetch(`/api/assignments/preview?courseId=${courseId}`);
      if(res2.ok){ setPreview(await res2.json()); }
    }
    loadTemplates();
  },[courseId]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">جدولة المهام للمعلم</h1>
      <div className="flex items-center space-x-2">
        <label>الدورة</label>
        <select className="border p-2" value={courseId} onChange={(e)=> setCourseId(e.target.value)}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <AssignmentsSchedulerSettings courseId={courseId} />
      <AssignmentTemplateForm courseId={courseId} onCreated={()=> {
        fetch(`/api/assignments/templates?courseId=${courseId}`).then(r=>r.json()).then(setTemplates);
        fetch(`/api/assignments/preview?courseId=${courseId}`).then(r=>r.json()).then(setPreview);
      }} />

      <section>
        <h3 className="font-bold">النماذج</h3>
        <ul className="list-disc pl-6">
          {templates.map(t => <li key={t.id}>{t.title}</li>)}
        </ul>
      </section>

      <section>
        <h3 className="font-bold">المعاينة (4 أسابيع)</h3>
        <ul className="list-disc pl-6">
          {preview.map((p,i)=> <li key={i}>{new Date(p.publishAt).toLocaleString('ar-EG')} - {p.title} - {p.status}</li>)}
        </ul>
      </section>
    </div>
  );
}
