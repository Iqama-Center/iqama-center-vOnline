import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';
import pool from '../../lib/db';
import { safeSerialize } from '../../lib/serializer';

export default function StudentAssignments({ user, enrolledCourses, assignments, selectedCourseId }) {
  const router = useRouter();

  const handleCourseChange = (e) => {
    const newCourseId = e.target.value;
    router.push(`/student/assignments?course_id=${newCourseId}`);
  };

  return (
    <Layout user={user}>
        <div className="container mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">المهام القادمة والنشطة</h1>
            
            {enrolledCourses.length > 0 ? (
                <>
                    <div>
                        <label htmlFor="course-select" className="block mb-2 text-sm font-medium text-gray-900">اختر الدورة:</label>
                        <select 
                            id="course-select"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            value={selectedCourseId}
                            onChange={handleCourseChange}
                        >
                        {enrolledCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {assignments.length > 0 ? (
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            {assignments.map(item => (
                            <li key={item.id} className="bg-gray-100 p-3 rounded-md">
                                <span className="font-semibold">{new Date(item.publish_at).toLocaleString('ar-EG')}</span> - 
                                <span>{item.title}</span> - 
                                <span className="font-bold text-blue-600">{item.status}</span>
                            </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 mt-4">لا توجد مهام مجدولة لهذه الدورة حاليًا.</p>
                    )}
                </>
            ) : (
                <p className="text-center text-gray-500 p-8">أنت غير مسجل في أي دورات نشطة حاليًا.</p>
            )}
        </div>
    </Layout>
  );
}

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const { course_id } = context.query;

    try {
        // 1. Fetch student's enrolled courses
        const coursesRes = await pool.query(
            `SELECT c.id, c.name 
             FROM courses c
             JOIN enrollments e ON c.id = e.course_id
             WHERE e.user_id = $1 AND e.status = 'active'
             ORDER BY c.name`,
            [user.id]
        );
        const enrolledCourses = coursesRes.rows;

        if (enrolledCourses.length === 0) {
            return { props: { user, enrolledCourses: [], assignments: [], selectedCourseId: null } };
        }

        // 2. Determine which course's assignments to fetch
        const targetCourseId = course_id || enrolledCourses[0].id;

        // 3. Fetch assignments for the target course
        const assignmentsRes = await pool.query(
            `SELECT 
                ao.id, 
                at.title, 
                ao.publish_at, 
                ao.status 
             FROM assignment_occurrences ao
             JOIN assignment_templates at ON ao.template_id = at.id
             WHERE at.course_id = $1 AND ao.status IN ('scheduled', 'posted')
             ORDER BY ao.publish_at ASC`,
            [targetCourseId]
        );
        const assignments = assignmentsRes.rows;

        return {
            props: {
                user,
                enrolledCourses: safeSerialize(enrolledCourses),
                assignments: safeSerialize(assignments),
                selectedCourseId: targetCourseId,
            },
        };
    } catch (error) {
        console.error('Error fetching student assignments:', error);
        return { props: { user, enrolledCourses: [], assignments: [], selectedCourseId: null, error: 'Failed to load data' } };
    }
});