
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const PublicLayout = ({ children, title = "مركز إقامة الكتاب" }) => {
    const [language, setLanguage] = useState('ar');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta name="description" content="مركز إقامة الكتاب - منصة متكاملة لإدارة المهام التعليمية والوظيفية" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={`public-layout ${language}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <header className="header">
                    <div className="container">
                        <div className="header-content">
                            {/* Logo */}
                            <div className="logo">
                                <Link href="/">
                                    <span className="logo-text">مركز إقامة الكتاب</span>
                                </Link>
                            </div>

                            {/* Navigation */}
                            <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                                <ul className="nav-list">
                                    <li><a href="#about">من نحن</a></li>
                                    <li><a href="#activities">أنشطتنا</a></li>
                                    <li><a href="#courses">الدورات</a></li>
                                    <li><a href="#faq">الأسئلة الشائعة</a></li>
                                    <li><a href="#contact">تواصل معنا</a></li>
                                </ul>
                            </nav>

                            {/* Action Buttons */}
                            <div className="header-actions">
                                <button className="lang-toggle" onClick={toggleLanguage}>
                                    {language === 'ar' ? 'English' : 'عربي'}
                                </button>
                                <Link href="/login" className="btn btn-outline">
                                    تسجيل الدخول
                                </Link>
                                <Link href="/signup" className="btn btn-primary">
                                    إنشاء حساب
                                </Link>
                                <button 
                                    className="mobile-menu-toggle"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="main">
                    {children}
                </main>

                {/* Footer */}
                <footer className="footer">
                    <div className="container">
                        <div className="footer-content">
                            <div className="footer-section">
                                <h3>مركز إقامة الكتاب</h3>
                                <p>منصة متكاملة لإدارة المهام التعليمية والوظيفية، ومتابعة أداء جميع المستخدمين</p>
                                <div className="social-links">
                                    <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                                    <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                                    <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                                    <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                                </div>
                            </div>
                            
                            <div className="footer-section">
                                <h4>روابط سريعة</h4>
                                <ul>
                                    <li><a href="#about">من نحن</a></li>
                                    <li><a href="#activities">أنشطتنا</a></li>
                                    <li><a href="#courses">الدورات</a></li>
                                    <li><Link href="/terms">الشروط والأحكام</Link></li>
                                    <li><Link href="/privacy">سياسة الخصوصية</Link></li>
                                </ul>
                            </div>
                            
                            <div className="footer-section">
                                <h4>تواصل معنا</h4>
                                <div className="contact-info">
                                    <p><i className="fas fa-phone"></i> +966 123 456 789</p>
                                    <p><i className="fas fa-envelope"></i> info@iqama-center.com</p>
                                    <p><i className="fas fa-map-marker-alt"></i> الرياض، المملكة العربية السعودية</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="footer-bottom">
                            <p>&copy; 2024 مركز إقامة الكتاب. جميع الحقوق محفوظة.</p>
                        </div>
                    </div>
                </footer>
            </div>

            <style jsx>{`
                .public-layout {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Tajawal', sans-serif;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                /* Header Styles */
                .header {
                    background: white;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 0;
                }

                .logo {
                    display: flex;
                    align-items: center;
                }

                .logo a {
                    text-decoration: none;
                    color: #0056b3;
                    font-weight: bold;
                    font-size: 1.5rem;
                }

                .nav-list {
                    display: flex;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    gap: 2rem;
                }

                .nav-list a {
                    text-decoration: none;
                    color: #333;
                    font-weight: 500;
                    transition: color 0.3s;
                }

                .nav-list a:hover {
                    color: #0056b3;
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .lang-toggle {
                    background: none;
                    border: 1px solid #ddd;
                    padding: 0.5rem 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .lang-toggle:hover {
                    background: #f8f9fa;
                }

                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: all 0.3s;
                    border: none;
                    cursor: pointer;
                    display: inline-block;
                    text-align: center;
                }

                .btn-primary {
                    background: #0056b3;
                    color: white;
                }

                .btn-primary:hover {
                    background: #004494;
                }

                .btn-outline {
                    background: transparent;
                    color: #0056b3;
                    border: 1px solid #0056b3;
                }

                .btn-outline:hover {
                    background: #0056b3;
                    color: white;
                }

                .mobile-menu-toggle {
                    display: none;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                }

                /* Main Content */
                .main {
                    flex: 1;
                }

                /* Footer Styles */
                .footer {
                    background: #2c3e50;
                    color: white;
                    margin-top: auto;
                }

                .footer-content {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                    padding: 3rem 0;
                }

                .footer-section h3,
                .footer-section h4 {
                    margin-bottom: 1rem;
                    color: #ecf0f1;
                }

                .footer-section ul {
                    list-style: none;
                    padding: 0;
                }

                .footer-section ul li {
                    margin-bottom: 0.5rem;
                }

                .footer-section a {
                    color: #bdc3c7;
                    text-decoration: none;
                    transition: color 0.3s;
                }

                .footer-section a:hover {
                    color: white;
                }

                .social-links {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .social-links a {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: #34495e;
                    border-radius: 50%;
                    transition: background 0.3s;
                }

                .social-links a:hover {
                    background: #0056b3;
                }

                .contact-info p {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .contact-info i {
                    margin-right: 0.5rem;
                    width: 20px;
                }

                .footer-bottom {
                    border-top: 1px solid #34495e;
                    padding: 1rem 0;
                    text-align: center;
                    color: #bdc3c7;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .header-content {
                        flex-wrap: wrap;
                    }

                    .nav {
                        display: none;
                        width: 100%;
                        order: 3;
                    }

                    .nav-open {
                        display: block;
                    }

                    .nav-list {
                        flex-direction: column;
                        gap: 1rem;
                        padding: 1rem 0;
                    }

                    .mobile-menu-toggle {
                        display: block;
                    }

                    .header-actions {
                        gap: 0.5rem;
                    }

                    .btn {
                        padding: 0.5rem 1rem;
                        font-size: 0.9rem;
                    }

                    .footer-content {
                        grid-template-columns: 1fr;
                        text-align: center;
                    }
                }

                /* RTL Support */
                .public-layout.en {
                    direction: ltr;
                }

                .public-layout.en .contact-info i {
                    margin-right: 0;
                    margin-left: 0.5rem;
                }
            `}</style>
        </>
    );
};

export default PublicLayout;
