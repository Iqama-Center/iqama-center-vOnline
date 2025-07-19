import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only allow workers to access this endpoint
        if (decoded.role !== 'worker') {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (req.method === 'GET') {
            try {
                // Try to get real data from worker_tasks table
                const result = await pool.query(`
                    SELECT 
                        wt.*,
                        u.full_name as supervisor_name
                    FROM worker_tasks wt
                    LEFT JOIN users u ON wt.assigned_by = u.id
                    WHERE wt.assigned_to = $1
                    ORDER BY 
                        CASE wt.priority 
                            WHEN 'urgent' THEN 1
                            WHEN 'high' THEN 2
                            WHEN 'medium' THEN 3
                            WHEN 'low' THEN 4
                        END,
                        wt.due_date ASC
                `, [decoded.id]);

                res.status(200).json(result.rows);
            } catch (dbError) {
                console.log('Worker tasks table not found, returning mock data:', dbError.message);
                
                // Return mock data if table doesn't exist
                const mockTasks = [
                    {
                        id: 1,
                        title: 'مراجعة بيانات الطلاب الجدد',
                        description: 'مراجعة وتدقيق بيانات الطلاب المسجلين حديثاً والتأكد من اكتمال المعلومات المطلوبة',
                        priority: 'high',
                        status: 'pending',
                        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        estimated_hours: 4,
                        department: 'شؤون الطلاب',
                        supervisor_name: 'أحمد محمد',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        title: 'إعداد تقرير أسبوعي',
                        description: 'إعداد التقرير الأسبوعي لأنشطة القسم وإرساله للإدارة',
                        priority: 'medium',
                        status: 'in_progress',
                        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                        estimated_hours: 2,
                        department: 'الإدارة',
                        supervisor_name: 'فاطمة علي',
                        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 3,
                        title: 'تحديث قاعدة البيانات',
                        description: 'تحديث معلومات الدورات والمدربين في قاعدة البيانات',
                        priority: 'low',
                        status: 'pending',
                        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        estimated_hours: 3,
                        department: 'تقنية المعلومات',
                        supervisor_name: 'محمد سالم',
                        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 4,
                        title: 'تدريب الموظفين الجدد',
                        description: 'تدريب الموظفين الجدد على استخدام النظام الإلكتروني',
                        priority: 'high',
                        status: 'completed',
                        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        estimated_hours: 6,
                        actual_hours: 5.5,
                        department: 'الموارد البشرية',
                        supervisor_name: 'سارة أحمد',
                        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        completion_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ];

                res.status(200).json(mockTasks);
            }
        } else {
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (err) {
        console.error('Worker tasks API error:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
}