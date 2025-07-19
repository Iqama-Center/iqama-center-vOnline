import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicLayout from './PublicLayout';

const LandingPage = () => {
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [contactMessage, setContactMessage] = useState('');

    useEffect(() => {
        loadFeaturedCourses();
    }, []);

    const loadFeaturedCourses = async () => {
        try {
            const response = await fetch('/api/courses/public');
            if (response.ok) {
                const courses = await response.json();
                setFeaturedCourses(courses.slice(0, 6)); // Show only 6 featured courses
            }
        } catch (err) {
            console.error('Failed to load courses:', err);
        }
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });
            
            if (response.ok) {
                setContactMessage('تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.');
                setContactForm({ name: '', email: '', message: '' });
            } else {
                setContactMessage('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
            }
        } catch (err) {
            setContactMessage('حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.');
        }
    };

    const faqData = [
        {
            question: "ما هو مركز إقامة الكتاب؟",
            answer: "مركز إقامة الكتاب هو منصة تعليمية متكاملة تهدف إلى تعليم القرآن الكريم والعلوم الشرعية بطريقة حديثة ومنظمة."
        },
        {
            question: "كيف يمكنني التسجيل في الدورات؟",
            answer: "يمكنك التسجيل بسهولة من خلال إنشاء حساب جديد، ثم تصفح الدورات المتاحة والتسجيل في الدورة المناسبة لك."
        },
        {
            question: "هل الدورات مجانية؟",
            answer: "بعض الدورات مجانية وبعضها مدفوع. ستجد تفاصيل الرسوم واضحة في صفحة كل دورة."
        },
        {
            question: "كيف يتم تحديد المستوى المناسب للطالب؟",
            answer: "نقوم بإجراء تقييم أولي لتحديد مستوى الطالب، ثم نضعه في المجموعة المناسبة لقدراته."
        },
        {
            question: "هل يمكن لولي الأمر متابعة تقدم الطفل؟",
            answer: "نعم، يمكن لولي الأمر متابعة تقدم الطفل من خلال لوحة تحكم خاصة تعرض التقارير والدرجات."
        }
    ];

    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1>مرحباً بكم في مركز إقامة الكتاب</h1>
                            <p className="hero-subtitle">
                                منصة متكاملة لإدارة المهام التعليمية والوظيفية، ومتابعة أداء جميع المستخدمين
                            </p>
                            <p className="hero-description">
                                نقدم تعليماً متميزاً في القرآن الكريم والعلوم الشرعية مع متابعة فردية لكل طالب
                                وأدوات حديثة لإدارة التعلم والتقييم.
                            </p>
                            <div className="hero-buttons">
                                <Link href="/signup" className="btn btn-primary btn-large">
                                    ابدأ رحلتك التعليمية
                                </Link>
                                <a href="#courses" className="btn btn-outline btn-large">
                                    تصفح الدورات
                                </a>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="hero-placeholder">
                                <i className="fas fa-book-open"></i>
                                <p>صورة توضيحية للمركز</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about">
                <div className="container">
                    <h2>من نحن</h2>
                    <div className="about-content">
                        <div className="about-text">
                            <p>
                                مركز إقامة الكتاب هو مؤسسة تعليمية رائدة تهدف إلى نشر تعاليم القرآن الكريم 
                                والعلوم الشرعية باستخدام أحدث الوسائل التكنولوجية والتعليمية.
                            </p>
                            <p>
                                نؤمن بأن التعليم الديني يجب أن يواكب العصر ويستفيد من التقنيات الحديثة 
                                لتقديم تجربة تعليمية متميزة وفعالة لجميع الأعمار.
                            </p>
                        </div>
                        <div className="about-features">
                            <div className="feature">
                                <i className="fas fa-users"></i>
                                <h3>مجتمع تعليمي متكامل</h3>
                                <p>طلاب ومعلمون وأولياء أمور في بيئة تعليمية واحدة</p>
                            </div>
                            <div className="feature">
                                <i className="fas fa-chart-line"></i>
                                <h3>متابعة مستمرة</h3>
                                <p>تقارير دورية وتقييم مستمر لضمان التقدم</p>
                            </div>
                            <div className="feature">
                                <i className="fas fa-certificate"></i>
                                <h3>شهادات معتمدة</h3>
                                <p>شهادات إتمام معتمدة لجميع الدورات</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Activities Section */}
            <section id="activities" className="activities">
                <div className="container">
                    <h2>أنشطتنا</h2>
                    <div className="activities-grid">
                        <div className="activity">
                            <i className="fas fa-quran"></i>
                            <h3>تحفيظ القرآن الكريم</h3>
                            <p>برامج متدرجة لتحفيظ القرآن الكريم مع التجويد والتلاوة الصحيحة</p>
                        </div>
                        <div className="activity">
                            <i className="fas fa-mosque"></i>
                            <h3>العلوم الشرعية</h3>
                            <p>دراسة الفقه والحديث والسيرة النبوية والعقيدة الإسلامية</p>
                        </div>
                        <div className="activity">
                            <i className="fas fa-pray"></i>
                            <h3>التربية الروحية</h3>
                            <p>برامج لتعزيز الجانب الروحي والأخلاقي للطلاب</p>
                        </div>
                        <div className="activity">
                            <i className="fas fa-language"></i>
                            <h3>اللغة العربية</h3>
                            <p>تعليم اللغة العربية وقواعدها وآدابها</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section id="courses" className="featured-courses">
                <div className="container">
                    <h2>أبرز الدورات</h2>
                    <div className="courses-grid">
                        {featuredCourses.length > 0 ? (
                            featuredCourses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-header">
                                        <h3>{course.name}</h3>
                                    </div>
                                    <p className="course-description">{course.description}</p>
                                    <div className="course-meta">
                                        <span><i className="fas fa-clock"></i> {course.details?.duration_weeks || 8} أسابيع</span>
                                        <span><i className="fas fa-users"></i> {course.current_enrollment || 0} طالب</span>
                                    </div>
                                    <Link href="/login" className="btn btn-primary">
                                        سجل الآن
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="no-courses">
                                <p>لا توجد دورات متاحة حالياً</p>
                            </div>
                        )}
                    </div>
                    <div className="courses-cta">
                        <Link href="/signup" className="btn btn-outline">
                            عرض جميع الدورات
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq">
                <div className="container">
                    <h2>الأسئلة الشائعة</h2>
                    <div className="faq-list">
                        {faqData.map((item, index) => (
                            <div key={index} className="faq-item">
                                <button className="faq-question" onClick={(e) => {
                                    const answer = e.target.nextElementSibling;
                                    const isOpen = answer.style.display === 'block';
                                    
                                    // Close all answers
                                    document.querySelectorAll('.faq-answer').forEach(ans => {
                                        ans.style.display = 'none';
                                    });
                                    
                                    // Toggle current answer
                                    if (!isOpen) {
                                        answer.style.display = 'block';
                                    }
                                }}>
                                    {item.question}
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                                <div className="faq-answer">
                                    <p>{item.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact">
                <div className="container">
                    <h2>تواصل معنا</h2>
                    <div className="contact-content">
                        <div className="contact-info">
                            <h3>معلومات التواصل</h3>
                            <div className="contact-item">
                                <i className="fas fa-phone"></i>
                                <span>+966 123 456 789</span>
                            </div>
                            <div className="contact-item">
                                <i className="fas fa-envelope"></i>
                                <span>info@iqama-center.com</span>
                            </div>
                            <div className="contact-item">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>الرياض، المملكة العربية السعودية</span>
                            </div>
                        </div>
                        
                        <div className="contact-form">
                            <h3>أرسل لنا رسالة</h3>
                            {contactMessage && (
                                <div className="contact-message">
                                    {contactMessage}
                                </div>
                            )}
                            <form onSubmit={handleContactSubmit}>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="الاسم"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder="البريد الإلكتروني"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <textarea
                                        placeholder="الرسالة"
                                        rows="5"
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    إرسال الرسالة
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
                /* Hero Section */
                .hero {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4rem 0;
                    min-height: 80vh;
                    display: flex;
                    align-items: center;
                }

                .hero-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: center;
                }

                .hero-text h1 {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }

                .hero-subtitle {
                    font-size: 1.3rem;
                    margin-bottom: 1rem;
                    opacity: 0.9;
                }

                .hero-description {
                    font-size: 1.1rem;
                    margin-bottom: 2rem;
                    opacity: 0.8;
                    line-height: 1.6;
                }

                .hero-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .btn-large {
                    padding: 1rem 2rem;
                    font-size: 1.1rem;
                }

                .hero-image {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .hero-placeholder {
                    background: rgba(255,255,255,0.1);
                    border: 2px dashed rgba(255,255,255,0.3);
                    border-radius: 10px;
                    padding: 3rem;
                    text-align: center;
                    width: 100%;
                    max-width: 400px;
                }

                .hero-placeholder i {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.7;
                }

                /* About Section */
                .about {
                    padding: 4rem 0;
                    background: #f8f9fa;
                }

                .about h2 {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 2.5rem;
                    color: #0056b3;
                }

                .about-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                    align-items: center;
                }

                .about-text p {
                    font-size: 1.1rem;
                    line-height: 1.8;
                    margin-bottom: 1.5rem;
                    color: #555;
                }

                .about-features {
                    display: grid;
                    gap: 2rem;
                }

                .feature {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    text-align: center;
                }

                .feature i {
                    font-size: 3rem;
                    color: #0056b3;
                    margin-bottom: 1rem;
                }

                .feature h3 {
                    margin-bottom: 1rem;
                    color: #333;
                }

                /* Activities Section */
                .activities {
                    padding: 4rem 0;
                    background: white;
                }

                .activities h2 {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 2.5rem;
                    color: #0056b3;
                }

                .activities-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                }

                .activity {
                    background: #f8f9fa;
                    padding: 2rem;
                    border-radius: 10px;
                    text-align: center;
                    transition: transform 0.3s;
                }

                .activity:hover {
                    transform: translateY(-5px);
                }

                .activity i {
                    font-size: 3rem;
                    color: #0056b3;
                    margin-bottom: 1rem;
                }

                .activity h3 {
                    margin-bottom: 1rem;
                    color: #333;
                }

                /* Featured Courses Section */
                .featured-courses {
                    padding: 4rem 0;
                    background: #f8f9fa;
                }

                .featured-courses h2 {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 2.5rem;
                    color: #0056b3;
                }

                .courses-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-bottom: 3rem;
                }

                .course-card {
                    background: white;
                    border-radius: 10px;
                    padding: 2rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    transition: transform 0.3s;
                }

                .course-card:hover {
                    transform: translateY(-5px);
                }

                .course-header {
                    margin-bottom: 1rem;
                }

                .course-header h3 {
                    color: #0056b3;
                    margin: 0;
                    flex: 1;
                }


                .course-description {
                    color: #666;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }

                .course-meta {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    color: #888;
                }

                .course-meta span {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .courses-cta {
                    text-align: center;
                }

                /* FAQ Section */
                .faq {
                    padding: 4rem 0;
                    background: white;
                }

                .faq h2 {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 2.5rem;
                    color: #0056b3;
                }

                .faq-list {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .faq-item {
                    margin-bottom: 1rem;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .faq-question {
                    width: 100%;
                    padding: 1.5rem;
                    background: #f8f9fa;
                    border: none;
                    text-align: right;
                    font-size: 1.1rem;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s;
                }

                .faq-question:hover {
                    background: #e9ecef;
                }

                .faq-answer {
                    display: none;
                    padding: 1.5rem;
                    background: white;
                    border-top: 1px solid #e0e0e0;
                }

                .faq-answer p {
                    margin: 0;
                    line-height: 1.6;
                    color: #555;
                }

                /* Contact Section */
                .contact {
                    padding: 4rem 0;
                    background: #f8f9fa;
                }

                .contact h2 {
                    text-align: center;
                    margin-bottom: 3rem;
                    font-size: 2.5rem;
                    color: #0056b3;
                }

                .contact-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                }

                .contact-info h3,
                .contact-form h3 {
                    margin-bottom: 2rem;
                    color: #333;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                }

                .contact-item i {
                    color: #0056b3;
                    width: 20px;
                }

                .contact-form {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .contact-message {
                    background: #d4edda;
                    color: #155724;
                    padding: 1rem;
                    border-radius: 5px;
                    margin-bottom: 1rem;
                    border: 1px solid #c3e6cb;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 1rem;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 1rem;
                }

                .form-group textarea {
                    resize: vertical;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .hero-content,
                    .about-content,
                    .contact-content {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }

                    .hero-text h1 {
                        font-size: 2rem;
                    }

                    .hero-buttons {
                        justify-content: center;
                    }

                    .activities-grid,
                    .courses-grid {
                        grid-template-columns: 1fr;
                    }

                }
            `}</style>
        </PublicLayout>
    );
};

export default LandingPage;