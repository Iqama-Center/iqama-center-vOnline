import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage('حدث خطأ في التحقق من البريد الإلكتروني');
    }
  };

  return (
    <>
      <Head>
        <title>تأكيد البريد الإلكتروني - مركز إقامة الكتاب</title>
      </Head>
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <h1>تأكيد البريد الإلكتروني</h1>
          </div>
          
          <div className="verification-content">
            {status === 'verifying' && (
              <div className="status-verifying">
                <div className="spinner"></div>
                <p>جاري التحقق من بريدك الإلكتروني...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="status-success">
                <i className="fas fa-check-circle"></i>
                <h2>تم تأكيد البريد الإلكتروني بنجاح!</h2>
                <p>{message}</p>
                <div className="action-buttons">
                  <Link href="/verify-phone" className="btn btn-primary">
                    التالي: تأكيد رقم الهاتف
                  </Link>
                  <Link href="/login" className="btn btn-outline">
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="status-error">
                <i className="fas fa-times-circle"></i>
                <h2>فشل في تأكيد البريد الإلكتروني</h2>
                <p>{message}</p>
                <div className="action-buttons">
                  <Link href="/resend-verification" className="btn btn-primary">
                    إعادة إرسال رابط التأكيد
                  </Link>
                  <Link href="/signup" className="btn btn-outline">
                    إنشاء حساب جديد
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .verification-container {
          font-family: 'Tajawal', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .verification-card {
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 100%;
          overflow: hidden;
        }

        .verification-header {
          background: #0056b3;
          color: white;
          padding: 2rem;
          text-align: center;
        }

        .verification-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }

        .verification-content {
          padding: 3rem 2rem;
          text-align: center;
        }

        .status-verifying {
          color: #666;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0056b3;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .status-success {
          color: #28a745;
        }

        .status-error {
          color: #dc3545;
        }

        .status-success i,
        .status-error i {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .status-success h2,
        .status-error h2 {
          margin: 1rem 0;
          color: #333;
        }

        .action-buttons {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s;
          border: 2px solid transparent;
          display: inline-block;
        }

        .btn-primary {
          background: #0056b3;
          color: white;
        }

        .btn-primary:hover {
          background: #004494;
          transform: translateY(-2px);
        }

        .btn-outline {
          background: transparent;
          color: #0056b3;
          border-color: #0056b3;
        }

        .btn-outline:hover {
          background: #0056b3;
          color: white;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .verification-content {
            padding: 2rem 1rem;
          }
          
          .action-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .btn {
            width: 100%;
            max-width: 250px;
          }
        }
      `}</style>
    </>
  );
}