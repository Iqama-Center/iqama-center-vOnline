import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function VerifyPhonePage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();

  useEffect(() => {
    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyPhone = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (code.length !== 6) {
      setMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(result.message);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage('حدث خطأ في التحقق من رقم الهاتف');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage('تم إرسال رمز جديد إلى هاتفك');
        setCanResend(false);
        setCountdown(60);
      } else {
        setMessage(result.message);
      }
    } catch (err) {
      setMessage('حدث خطأ في إعادة الإرسال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>تأكيد رقم الهاتف - مركز إقامة الكتاب</title>
      </Head>
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <h1>تأكيد رقم الهاتف</h1>
            <p>تم إرسال رمز التحقق إلى هاتفك</p>
          </div>
          
          <div className="verification-content">
            {status === 'success' ? (
              <div className="status-success">
                <i className="fas fa-check-circle"></i>
                <h2>تم تأكيد رقم الهاتف بنجاح!</h2>
                <p>{message}</p>
                <p>سيتم توجيهك لصفحة تسجيل الدخول...</p>
              </div>
            ) : (
              <form onSubmit={verifyPhone}>
                <div className="code-input-container">
                  <label htmlFor="code">أدخل رمز التحقق (6 أرقام)</label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength="6"
                    className="code-input"
                    required
                  />
                </div>

                {message && (
                  <div className={`message ${status === 'error' ? 'error' : 'info'}`}>
                    {message}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}
                </button>

                <div className="resend-section">
                  <p>لم تستلم الرمز؟</p>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={!canResend || isLoading}
                    className="btn btn-outline"
                  >
                    {canResend ? 'إعادة الإرسال' : `إعادة الإرسال خلال ${countdown}s`}
                  </button>
                </div>
              </form>
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
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .verification-header p {
          margin: 0;
          opacity: 0.9;
        }

        .verification-content {
          padding: 3rem 2rem;
        }

        .code-input-container {
          margin-bottom: 2rem;
        }

        .code-input-container label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .code-input {
          width: 100%;
          padding: 1rem;
          font-size: 1.5rem;
          text-align: center;
          border: 2px solid #ddd;
          border-radius: 8px;
          letter-spacing: 0.5rem;
          font-family: monospace;
          transition: border-color 0.3s;
        }

        .code-input:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.1);
        }

        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message.info {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .btn {
          width: 100%;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 1rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #0056b3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #004494;
          transform: translateY(-2px);
        }

        .btn-outline {
          background: transparent;
          color: #0056b3;
          border-color: #0056b3;
        }

        .btn-outline:hover:not(:disabled) {
          background: #0056b3;
          color: white;
        }

        .resend-section {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #eee;
        }

        .resend-section p {
          margin-bottom: 1rem;
          color: #666;
        }

        .status-success {
          text-align: center;
          color: #28a745;
        }

        .status-success i {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .status-success h2 {
          color: #333;
          margin: 1rem 0;
        }

        @media (max-width: 768px) {
          .verification-content {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </>
  );
}