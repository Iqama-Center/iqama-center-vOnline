import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const AdminCoursesPage = () => {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the comprehensive course management page
        router.replace('/admin/courses/manage');
    }, [router]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#007bff' }}></i>
            <p>جاري التوجيه إلى إدارة الدورات الشاملة...</p>
        </div>
    );
};

export default AdminCoursesPage;