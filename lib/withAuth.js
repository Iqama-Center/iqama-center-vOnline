import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import pool from './db'; // Use the shared pool

export function withAuth(handler, options = {}) {
    return async (context) => {
        const { req } = context;

        // If there's no request, we're likely in a build environment.
        // Return empty props and let the client-side handle auth.
        if (!req) {
            return { props: { user: null } };
        }

        const cookies = parse(req.headers.cookie || '');
        // تعديل: استخدم view_token إذا وجد
        const tokenToUse = cookies.view_token || cookies.token;
        if (!tokenToUse) {
            return { redirect: { destination: '/login', permanent: false } };
        }
        try {
            const decoded = jwt.verify(tokenToUse, process.env.JWT_SECRET);
            
            // Validate that decoded.id is a valid number
            if (!decoded.id || isNaN(parseInt(decoded.id))) {
                console.error("Authentication Error in withAuth: Invalid user ID in token");
                return { redirect: { destination: '/login', permanent: false } };
            }
            
            const userResult = await pool.query(
                'SELECT id, full_name, email, phone, role, account_status, details FROM users WHERE id = $1', 
                [parseInt(decoded.id)]
            );
            if (userResult.rows.length === 0) {
                return { redirect: { destination: '/login', permanent: false } };
            }
            const user = JSON.parse(JSON.stringify(userResult.rows[0]));
            // إضافة التحقق من الحجب المالي
            const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            const paymentLockResult = await pool.query(
                `SELECT 1 FROM payments p
                 JOIN enrollments e ON p.enrollment_id = e.id
                 WHERE e.user_id = $1 AND p.status = 'late' AND p.due_date < $2`,
                [user.id, tenDaysAgo]
            );
            if (paymentLockResult.rows.length > 0) {
                user.is_payment_locked = true;
            }
            if (options.roles && !options.roles.includes(user.role)) {
                return { redirect: { destination: '/dashboard', permanent: false }, props: { error: 'غير مصرح لك بالوصول.' } };
            }
            
            const pageProps = handler ? await handler(context) : { props: {} };

            return {
                ...pageProps,
                props: {
                    ...pageProps.props,
                    user,
                },
            };
        } catch (err) {
            console.error("Authentication Error in withAuth:", err.message);
            return { redirect: { destination: '/login', permanent: false } };
        }
    };
}