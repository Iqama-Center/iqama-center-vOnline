import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/serializer';
import AssignmentsSchedulerSettings from '../../components/AssignmentsSchedulerSettings';
import AssignmentTemplateForm from '../../components/AssignmentTemplateForm';

export default function TeacherAssignmentsPage({ user, courses, templates, preview, selectedCourseId }) {
  const router = useRouter();

  const handleCourseChange = (e) => {
    const newCourseId = e.target.value;
    router.push(`/teacher/assignments?course_id=${newCourseId}`);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  return (
    <Layout user={user}>
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">جدولة المهام للمعلم</h1>
            
            {courses.length > 0 ? (
                <>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="course-select">الدورة</label>
                        <select id="course-select" className="border p-2" value={selectedCourseId} onChange={handleCourseChange}>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <AssignmentsSchedulerSettings courseId={selectedCourseId} />
                    <AssignmentTemplateForm courseId={selectedCourseId} onCreated={refreshData} />

                    <section>
                        <h3 className="font-bold">النماذج الحالية</h3>
                        <ul className="list-disc pl-6">
                        {templates.map(t => <li key={t.id}>{t.title}</li>)}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold">المعاينة (4 أسابيع قادمة)</h3>
                        <ul className="list-disc pl-6">
                        {preview.map((p,i)=> <li key={i}>{new Date(p.publish_at).toLocaleString('ar-EG')} - {p.title} - {p.status}</li>)}
                        </ul>
                    </section>
                </>
            ) : (
                <p>أنت غير مسجل كمدرس في أي دورات حاليًا.</p>
            )}
        </div>
    </Layout>
  );
}

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const { course_id } = context.query;

    if (user.role !== 'teacher' && user.role !== 'admin') {
        return { redirect: { destination: '/dashboard', permanent: false } };
    }

    try {
        const coursesRes = await pool.query(
            'SELECT id, name FROM courses WHERE teacher_id = $1 ORDER BY name',
            [user.id]
        );
        const courses = coursesRes.rows;

        if (courses.length === 0) {
            return { props: { user, courses: [], templates: [], preview: [], selectedCourseId: null } };
        }

        const targetCourseId = course_id || courses[0].id;

        const templatesRes = await pool.query('SELECT * FROM assignment_templates WHERE course_id = $1', [targetCourseId]);
        
        // This is a simplified preview logic. The original API might have more complex logic.
        const previewRes = await pool.query(
            `SELECT at.title, ao.publish_at, ao.status
             FROM assignment_occurrences ao
             JOIN assignment_templates at ON ao.template_id = at.id
             WHERE at.course_id = $1 AND ao.publish_at BETWEEN NOW() AND NOW() + INTERVAL '4 weeks'
             ORDER BY ao.publish_at ASC`,
            [targetCourseId]
        );

        return {
            props: {
                user,
                courses: safeSerialize(courses),
                templates: safeSerialize(templatesRes.rows),
                preview: safeSerialize(previewRes.rows),
                selectedCourseId: targetCourseId,
            },
        };
    } catch (error) {
        console.error('Error fetching teacher assignments data:', error);
        return { props: { user, courses: [], templates: [], preview: [], selectedCourseId: null, error: 'Failed to load data' } };
    }
});