import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent form submission if fields are empty
    if (!emailOrPhone || !password) {
      setMessage('يرجى ملء جميع الحقول المطلوبة');
      setIsError(true);
      return;
    }

    setMessage('جاري تسجيل الدخول...');
    setIsError(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ 
          emailOrPhone: emailOrPhone.trim(), 
          password: password 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.redirectTo) {
        setMessage('تم تسجيل الدخول بنجاح! جاري التوجيه...');
        setIsError(false);
        
        // Use window.location for more reliable redirect
        setTimeout(() => {
          window.location.href = result.redirectTo;
        }, 1000);
      } else {
        throw new Error('لم يتم تحديد صفحة التوجيه');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage(err.message || 'لا يمكن الاتصال بالخادم.');
      setIsError(true);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>تسجيل الدخول</title>
        
      </Head>
      <div className="form-page-container">
        <div className="form-container">
          <h2>تسجيل الدخول</h2>
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} method="POST" action="#">
            <div className="form-group">
              <label htmlFor="emailOrPhone">البريد الإلكتروني أو رقم الهاتف</label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="example@gmail.com أو 01234567890"
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">كلمة السر</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={!emailOrPhone || !password}>
              {message && message.includes('جاري') ? 'جاري تسجيل الدخول...' : 'دخول'}
            </button>
          </form>
          <p className="form-link">
            ليس لديك حساب؟ <Link href="/signup">إنشاء حساب جديد</Link>
          </p>
          <p className="form-link">
            <Link href="/">العودة للصفحة الرئيسية</Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        .form-page-container {
          font-family: 'Tajawal', sans-serif;
          background-color: #f4f4f4;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .form-container {
          background: #fff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        h2 {
          text-align: center;
          color: #0056b3;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
        }
        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        button {
          width: 100%;
          padding: 12px;
          border: none;
          background-color: #0056b3;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s ease;
        }
        button:hover:not(:disabled) {
          background-color: #004494;
        }
        button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .message {
          text-align: center;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        .error {
          color: #721c24;
          background-color: #f8d7da;
        }
        .success {
          color: #155724;
          background-color: #d4edda;
        }
        .form-link {
          text-align: center;
          margin-top: 20px;
        }
      `}</style>
    </>
  );
}
