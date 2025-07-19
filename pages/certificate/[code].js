
import React from 'react';
import pool from '../../lib/db';
import PublicLayout from '../../components/PublicLayout'; // A layout for public pages

const CertificateVerificationPage = ({ certificate, error }) => {

    if (error) {
        return <PublicLayout><div className="container"><h1>خطأ</h1><p>{error}</p></div></PublicLayout>;
    }

    return (
        <PublicLayout>
            <style jsx>{`
                .certificate-container { 
                    font-family: 'Cairo', sans-serif;
                    border: 10px solid #0056b3;
                    padding: 50px;
                    margin: 50px auto;
                    max-width: 800px;
                    text-align: center;
                    background: white;
                    position: relative;
                }
                .logo { font-size: 2rem; font-weight: bold; color: #0056b3; }
                h1 { color: #0056b3; }
                h2 { color: #333; }
                p { font-size: 1.2rem; }
                .signature { margin-top: 50px; }
            `}</style>
            <div className="certificate-container">
                <div className="logo">مركز إقامة الكتاب</div>
                <h1>شهادة إتمام دورة</h1>
                <p>تشهد إدارة المركز بأن</p>
                <h2>{certificate.student_name}</h2>
                <p>قد أتم بنجاح متطلبات دورة</p>
                <h2>{certificate.course_name}</h2>
                <p>وذلك بتاريخ {new Date(certificate.issue_date).toLocaleDateString('ar-EG')} بتقدير</p>
                <h2>{certificate.grade}</h2>
                <div className="signature">
                    <p>___________________</p>
                    <p>مدير المركز</p>
                </div>
                <small>رمز التحقق: {certificate.certificate_code}</small>
            </div>
        </PublicLayout>
    );
};

export async function getServerSideProps(context) {
    const { code } = context.params;

    try {
        const certRes = await pool.query(`
            SELECT 
                cert.issue_date, cert.certificate_code, cert.grade,
                u.full_name as student_name,
                c.name as course_name
            FROM certificates cert
            JOIN enrollments e ON cert.enrollment_id = e.id
            JOIN users u ON e.user_id = u.id
            JOIN courses c ON e.course_id = c.id
            WHERE cert.certificate_code = $1
        `, [code]);

        if (certRes.rows.length === 0) {
            return { props: { error: 'الشهادة غير موجودة أو الرمز غير صحيح.' } };
        }

        return {
            props: { 
                certificate: JSON.parse(JSON.stringify(certRes.rows[0]))
            }
        };
    } catch (err) {
        console.error(err);
        return { props: { error: 'حدث خطأ أثناء محاولة التحقق من الشهادة.' } };
    }
}

export default CertificateVerificationPage;
