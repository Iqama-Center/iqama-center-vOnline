import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'العنوان مطلوب'),
  description: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default function AssignmentTemplateForm({ courseId, onCreated }){
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', attachments: [], startDate: '', endDate: '' },
  });

  const onSubmit = async (values) => {
    const parsed = schema.safeParse(values);
    if(!parsed.success){ alert(parsed.error.issues[0].message); return; }
    const res=await fetch('/api/assignments/templates',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...values, courseId })
    });
    if(res.ok){ reset(); const data=await res.json(); onCreated && onCreated(data); }
    else { const e=await res.json(); alert(e.message||'خطأ'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded space-y-4">
      <h3 className="font-bold">نموذج مهمة (مهام)</h3>
      <div>
        <label>العنوان</label>
        <input className="border p-2 w-full" {...register('title')} />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>
      <div>
        <label>الوصف</label>
        <textarea className="border p-2 w-full" rows={3} {...register('description')} />
      </div>
      <div>
        <label>مرفقات (روابط)</label>
        <input className="border p-2 w-full" placeholder="https://..." {...register('attachments.0')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label>تاريخ البداية (اختياري)</label>
          <input type="date" className="border p-2 w-full" {...register('startDate')} />
        </div>
        <div>
          <label>تاريخ النهاية (اختياري)</label>
          <input type="date" className="border p-2 w-full" {...register('endDate')} />
        </div>
      </div>
      <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">إنشاء</button>
    </form>
  );
}
