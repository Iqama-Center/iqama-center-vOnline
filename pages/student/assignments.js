import React, { useEffect, useState } from 'react';

export default function StudentAssignments(){
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [items, setItems] = useState([]);

  useEffect(()=>{
    async function load(){
      const res = await fetch('/api/teacher/courses'); // reuse endpoint for demo; ideally student courses endpoint
      if(res.ok){ const data = await res.json(); setCourses(data); if(data.length) setCourseId(data[0].id); }
    }
    load();
  },[]);

  useEffect(()=>{
    async function loadItems(){
      if(!courseId) return;
      const res = await fetch(`/api/assignments/student-list?courseId=${courseId}`);
      if(res.ok){ setItems(await res.json()); }
    }
    loadItems();
  },[courseId]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">المهام القادمة والنشطة</h1>
      <div>
        <label>الدورة</label>
        <select className="border p-2" value={courseId} onChange={(e)=> setCourseId(e.target.value)}>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <ul className="list-disc pl-6">
        {items.map(item => (
          <li key={item.id}>
            {new Date(item.publish_at).toLocaleString('ar-EG')} - {item.title} - {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
