import React from 'react';
import Head from 'next/head';
import PublicLayout from '../components/PublicLayout';

export default function TermsPage() {
    return (
        <PublicLayout title="الشروط والأحكام - مركز إقامة الكتاب">
            <div className="terms-container">
                <div className="container">
                    <h1>الشروط والأحكام</h1>
                    
                    <div className="terms-content">
                        <section>
                            <h2>1. مقدمة</h2>
                            <p>مرحباً بكم في مركز إقامة الكتاب. هذه الشروط والأحكام تحكم استخدامكم لموقعنا الإلكتروني وخدماتنا التعليمية.</p>
                        </section>

                        <section>
                            <h2>2. قبول الشروط</h2>
                            <p>باستخدام موقعنا أو خدماتنا، فإنكم توافقون على الالتزام بهذه الشروط والأحكام. إذا كنتم لا توافقون على أي من هذه الشروط، يرجى عدم استخدام خدماتنا.</p>
                        </section>

                        <section>
                            <h2>3. الخدمات المقدمة</h2>
                            <p>يقدم مركز إقامة الكتاب:</p>
                            <ul>
                                <li>دورات تعليمية في القرآن الكريم والعلوم الشرعية</li>
                                <li>منصة إلكترونية لإدارة التعلم</li>
                                <li>خدمات المتابعة والتقييم</li>
                                <li>شهادات إتمام الدورات</li>
                            </ul>
                        </section>

                        <section>
                            <h2>4. التسجيل والحسابات</h2>
                            <p>عند التسجيل في موقعنا، يجب عليكم:</p>
                            <ul>
                                <li>تقديم معلومات صحيحة ومحدثة</li>
                                <li>الحفاظ على سرية كلمة المرور</li>
                                <li>إشعارنا فوراً بأي استخدام غير مصرح به لحسابكم</li>
                                <li>تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابكم</li>
                            </ul>
                        </section>

                        <section>
                            <h2>5. الرسوم والمدفوعات</h2>
                            <p>بعض خدماتنا قد تتطلب دفع رسوم. في هذه الحالة:</p>
                            <ul>
                                <li>ستكون الرسوم واضحة قبل التسجيل</li>
                                <li>المدفوعات غير قابلة للاسترداد إلا في حالات استثنائية</li>
                                <li>يجب سداد الرسوم في المواعيد المحددة</li>
                                <li>التأخير في السداد قد يؤدي إلى تعليق الخدمة</li>
                            </ul>
                        </section>

                        <section>
                            <h2>6. قواعد السلوك</h2>
                            <p>يجب على جميع المستخدمين:</p>
                            <ul>
                                <li>احترام الآخرين والتعامل بأدب</li>
                                <li>عدم نشر محتوى مسيء أو غير لائق</li>
                                <li>عدم انتهاك حقوق الملكية الفكرية</li>
                                <li>الالتزام بالقيم الإسلامية والأخلاق الحميدة</li>
                            </ul>
                        </section>

                        <section>
                            <h2>7. الملكية الفكرية</h2>
                            <p>جميع المحتويات المتاحة على موقعنا محمية بحقوق الطبع والنشر. لا يجوز نسخ أو توزيع أو استخدام المحتوى دون إذن كتابي مسبق.</p>
                        </section>

                        <section>
                            <h2>8. إنهاء الخدمة</h2>
                            <p>نحتفظ بالحق في إنهاء أو تعليق حسابكم في حالة انتهاك هذه الشروط أو لأي سبب آخر نراه مناسباً.</p>
                        </section>

                        <section>
                            <h2>9. تحديث الشروط</h2>
                            <p>قد نقوم بتحديث هذه الشروط من وقت لآخر. سيتم إشعاركم بأي تغييرات مهمة عبر البريد الإلكتروني أو إشعار على الموقع.</p>
                        </section>

                        <section>
                            <h2>10. التواصل</h2>
                            <p>لأي استفسارات حول هذه الشروط، يرجى التواصل معنا عبر:</p>
                            <ul>
                                <li>البريد الإلكتروني: info@iqama-center.com</li>
                                <li>الهاتف: +966 123 456 789</li>
                            </ul>
                        </section>

                        <div className="last-updated">
                            <p><strong>آخر تحديث:</strong> 1 يناير 2024</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .terms-container {
                    background: #f8f9fa;
                    min-height: 80vh;
                    padding: 2rem 0;
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                h1 {
                    text-align: center;
                    color: #0056b3;
                    margin-bottom: 2rem;
                    font-size: 2.5rem;
                }

                .terms-content {
                    background: white;
                    padding: 3rem;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                section {
                    margin-bottom: 2rem;
                }

                h2 {
                    color: #0056b3;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 0.5rem;
                }

                p {
                    line-height: 1.8;
                    margin-bottom: 1rem;
                    color: #333;
                }

                ul {
                    margin: 1rem 0;
                    padding-right: 2rem;
                }

                li {
                    margin-bottom: 0.5rem;
                    line-height: 1.6;
                }

                .last-updated {
                    background: #e9ecef;
                    padding: 1rem;
                    border-radius: 5px;
                    margin-top: 2rem;
                    text-align: center;
                }

                @media (max-width: 768px) {
                    .terms-content {
                        padding: 1.5rem;
                    }

                    h1 {
                        font-size: 2rem;
                    }

                    ul {
                        padding-right: 1rem;
                    }
                }
            `}</style>
        </PublicLayout>
    );
}