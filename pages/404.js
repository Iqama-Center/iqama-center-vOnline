import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - الصفحة غير موجودة</title>
      </Head>
      <div style={{ fontFamily: 'Tajawal, sans-serif', textAlign: 'center', padding: '50px' }}>
        <h1>404 - الصفحة غير موجودة</h1>
        <p>عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        <Link href="/dashboard" legacyBehavior><a style={{ color: '#0056b3', textDecoration: 'none' }}>العودة إلى لوحة التحكم</a></Link>
      </div>
    </>
  );
}
