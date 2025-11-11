import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const TranslateCoursesPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [courses, setCourses] = useState([]);

  const checkCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/translate-course-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });

      const result = await response.json();
      if (response.ok) {
        setCourses(result.courses);
        setMessage({ text: result.message, type: 'success' });
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال', type: 'error' });
    }
    setLoading(false);
  };

  const translateCourses = async () => {
    // if (!window.confirm('هل أنت متأكد من ترجمة جميع تفاصيل الدورات؟')) {
    //   return;
    // }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/translate-course-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate' })
      });

      const result = await response.json();
      if (response.ok) {
        setMessage({ text: result.message, type: 'success' });
        // Refresh the check
        setTimeout(() => checkCourses(), 1000);
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <Layout user={user}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>ترجمة تفاصيل الدورات</h1>
        
        {message && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={checkCourses}
            disabled={loading}
            style={{
              padding: '10px 20px',
              marginLeft: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'جاري الفحص...' : 'فحص الدورات'}
          </button>

          <button
            onClick={translateCourses}
            disabled={loading || courses.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (loading || courses.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'جاري الترجمة...' : 'ترجمة الدورات'}
          </button>
        </div>

        {courses.length > 0 && (
          <div>
            <h2>الدورات التي تحتوي على محتوى إنجليزي ({courses.length})</h2>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {courses.map(course => (
                <div key={course.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h3>الدورة #{course.id}: {course.name}</h3>
                  <div style={{ 
                    backgroundColor: '#fff',
                    padding: '10px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}>
                    <pre>{JSON.stringify(course.details, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps = withAuth(async (context) => {
  // You can add any server-side logic here if needed.
  // The user object will be automatically added to props by withAuth.
  return { props: {} };
}, ['admin']);

export default TranslateCoursesPage;
