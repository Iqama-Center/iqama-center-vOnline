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
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(result.redirectTo);
      } else {
        setMessage(result.message);
        setIsError(true);
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setMessage('لا يمكن الاتصال بالخادم.');
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
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="emailOrPhone">البريد الإلكتروني أو رقم الهاتف</label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="example@gmail.com أو 05xxxxxxxx"
                required
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
              />
            </div>
            <button type="submit">دخول</button>
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
