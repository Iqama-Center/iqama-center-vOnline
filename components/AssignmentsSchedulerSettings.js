import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  days: z.array(z.enum(['sat','sun','mon','tue','wed','thu','fri'])).nonempty('اختر أياماً'),
  publishTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'HH:mm'),
  isPaused: z.boolean().optional(),
});

export default function AssignmentsSchedulerSettings({ courseId }){
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { days: [], publishTime: '18:00', isPaused: false },
  });

  useEffect(()=>{
    async function load(){
      const res=await fetch(`/api/assignments/schedule?courseId=${courseId}`);
      if(res.ok){
        const data=await res.json();
        if(data){
          setValue('days', data.days.split(','));
          setValue('publishTime', data.publish_time);
          setValue('isPaused', data.is_paused);
        }
      }
    }
    if(courseId) load();
  },[courseId, setValue]);

  const onSubmit = async (values) => {
    const parsed = schema.safeParse(values);
    if(!parsed.success){ alert(parsed.error.issues[0].message); return; }
    const body = {
      courseId,
      days: values.days.join(','),
      publishTime: values.publishTime,
      isPaused: values.isPaused
    };
    const res=await fetch('/api/assignments/schedule',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    if(res.ok){ alert('تم الحفظ'); }
    else { const e=await res.json(); alert(e.message||'خطأ'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 border rounded space-y-4">
      <h3 className="font-bold">جدولة المهام</h3>
      <div className="grid grid-cols-2 gap-2">
        {['sat','sun','mon','tue','wed','thu','fri'].map(d=> (
          <label key={d} className="flex items-center space-x-2">
            <input type="checkbox" value={d} {...register('days')} />
            <span>{d}</span>
          </label>
        ))}
      </div>
      <div>
        <label>وقت النشر الافتراضي</label>
        <input className="border p-2" placeholder="HH:mm" {...register('publishTime')} />
        {errors.publishTime && <p className="text-red-500 text-sm">{errors.publishTime.message}</p>}
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('isPaused')} />
          <span>إيقاف مؤقت</span>
        </label>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">حفظ</button>
    </form>
  );
}
