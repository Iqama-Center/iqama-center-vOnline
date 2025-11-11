import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { withAuth } from '../../lib/withAuth';

const TranslateJsonKeysPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const checkCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/translate-course-json-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });

      const result = await response.json();
      if (response.ok) {
        setCheckResult(result);
        setMessage({ text: result.message, type: 'success' });
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'حدث خطأ في الاتصال', type: 'error' });
    }
    setLoading(false);
  };

  const translateKeys = async () => {
    // if (!window.confirm('هل أنت متأكد من ترجمة مفاتيح JSON في جميع الدورات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
    //   return;
    // }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/translate-course-json-keys', {
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

  const previewCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/translate-course-json-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', courseId })
      });

      const result = await response.json();
      if (response.ok) {
        setPreviewData(result);
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
        <h1>ترجمة مفاتيح JSON في تفاصيل الدورات</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          هذه الأداة تترجم مفاتيح JSON الإنجليزية (مثل cost, currency, max_seats) إلى العربية في تفاصيل الدورات
        </p>
        
        {message && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
            {' '}{message.text}
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={checkCourses}
            disabled={loading}
            style={{
              padding: '12px 24px',
              marginLeft: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-search"></i> {loading ? 'جاري الفحص...' : 'فحص الدورات'}
          </button>

          <button
            onClick={translateKeys}
            disabled={loading || !checkResult || checkResult.coursesWithEnglishKeys === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (loading || !checkResult || checkResult.coursesWithEnglishKeys === 0) ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-language"></i> {loading ? 'جاري الترجمة...' : 'ترجمة المفاتيح'}
          </button>
        </div>

        {checkResult && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3>نتائج الفحص</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {checkResult.totalCourses}
                  </div>
                  <div>إجمالي الدورات</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                    {checkResult.coursesWithEnglishKeys}
                  </div>
                  <div>دورات تحتاج ترجمة</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {checkResult && checkResult.courses && checkResult.courses.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3>عينة من الدورات التي تحتاج ترجمة (أول 10 دورات)</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {checkResult.courses.map(course => (
                <div key={course.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>الدورة #{course.id}: {course.name}</h4>
                    <button
                      onClick={() => previewCourse(course.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      معاينة الترجمة
                    </button>
                  </div>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '10px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    <strong>المفاتيح الحالية:</strong>
                    <pre>{JSON.stringify(course.details, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {previewData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>معاينة الترجمة - الدورة #{previewData.courseId}</h3>
                <button
                  onClick={() => setPreviewData(null)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4>قبل الترجمة (الحالي)</h4>
                  <div style={{
                    backgroundColor: '#f8d7da',
                    padding: '15px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <pre>{JSON.stringify(previewData.original, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h4>بعد الترجمة (المقترح)</h4>
                  <div style={{
                    backgroundColor: '#d4edda',
                    padding: '15px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <pre>{JSON.stringify(previewData.translated, null, 2)}</pre>
                  </div>
                </div>
              </div>
              
              {Object.keys(previewData.keyMappings).length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>خريطة الترجمة</h4>
                  <div style={{ backgroundColor: '#e2e3e5', padding: '10px', borderRadius: '5px' }}>
                    {Object.entries(previewData.keyMappings).map(([english, arabic]) => (
                      <div key={english} style={{ marginBottom: '5px' }}>
                        <code>{english}</code> → <code>{arabic}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default TranslateJsonKeysPage;
