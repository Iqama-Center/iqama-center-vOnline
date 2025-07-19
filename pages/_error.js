
import React from 'react';
import Head from 'next/head';

import Link from 'next/link';

function Error({ statusCode }) {
  return (
    <>
      <Head>
        <title>خطأ</title>
      </Head>
      <div style={{ fontFamily: 'Tajawal, sans-serif', textAlign: 'center', padding: '50px' }}>
        <h1>
          {statusCode
            ? `حدث خطأ ${statusCode} على الخادم`
            : 'حدث خطأ على المتصفح'}
        </h1>
        <p>نعتذر عن هذا الخلل، يرجى المحاولة مرة أخرى لاحقاً.</p>
        <Link href="/dashboard" legacyBehavior><a style={{ color: '#0056b3', textDecoration: 'none' }}>العودة إلى لوحة التحكم</a></Link>
      </div>
    </>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
