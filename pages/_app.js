import '../styles/globals.css';
import taskScheduler from '../lib/taskScheduler';
import { useEffect } from 'react';

// Import the internal scheduler
let scheduler;
if (typeof window === 'undefined') {
  // Only import on server-side to avoid browser errors
  scheduler = require('../lib/internalScheduler').default;
}
import { Tajawal } from 'next/font/google';

// 1. قم بتكوين الخط مع الأوزان التي تحتاجها
const tajawalFont = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap', // يضمن ظهور النص بخط بديل حتى يتم تحميل الخط الرئيسي
  variable: '--font-tajawal', // إنشاء متغير CSS لاستخدامه بسهولة
});

// Start task scheduler on app initialization
if (typeof window === 'undefined') {
  taskScheduler.start();
}

function MyApp({ Component, pageProps }) {
  // Start the internal scheduler when app loads
  useEffect(() => {
    // Only run on client-side to trigger server-side scheduler
    if (typeof window !== 'undefined') {
      // Call the API to ensure scheduler is running
      fetch('/api/scheduler/start', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('Course automation scheduler is running');
          console.log('Features active:', data.features || [
            'Daily task release',
            'Performance evaluation', 
            'Auto-launch checking'
          ]);
        }
      })
      .catch(err => {
        console.warn('Warning: Scheduler start check failed:', err);
        // Non-critical error, app can continue without scheduler
      });
    }
  }, []);

  // 2. طبق المتغير على كامل التطبيق
  return (
    <main className={`${tajawalFont.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;