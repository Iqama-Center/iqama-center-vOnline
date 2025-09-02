import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import TaskNotificationSystem from './TaskNotificationSystem';
import TaskNotificationSystemFallback from './TaskNotificationSystemFallback';
import Pusher from 'pusher-js';
import AIAssistant from './AIAssistant';

const Sidebar = ({ user, currentPath, isMobile, sidebarExpanded, setSidebarExpanded }) => {
    const navLinks = [
        { href: '/dashboard', text: 'لوحة التحكم', icon: 'fa-tachometer-alt', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/courses', text: 'الدورات', icon: 'fa-book', roles: ['student', 'teacher', 'worker', 'parent'] },
        { href: '/teacher/my-courses', text: 'دوراتي', icon: 'fa-chalkboard-teacher', roles: ['teacher', 'head', 'admin'] },
        
        // Section: Admin & Finance
        { title: 'إدارة النظام', roles: ['admin', 'head', 'finance'] },
        { href: '/admin/users', text: 'إدارة المستخدمين', icon: 'fa-users-cog', roles: ['admin'] },
        { href: '/admin/courses/manage', text: 'إدارة الدورات', icon: 'fa-cogs', roles: ['admin', 'head'] },
        { href: '/admin/enrollments', text: 'إدارة التسجيلات', icon: 'fa-user-check', roles: ['admin', 'head', 'finance'] },
        { href: '/finance', text: 'إدارة المدفوعات', icon: 'fa-money-bill-wave', roles: ['admin', 'finance'] },
        { href: '/admin/requests', text: 'طلبات التعديل', icon: 'fa-check-square', roles: ['admin'] },
        
        // Section: Worker
        { title: 'إدارة العمل', roles: ['worker'] },
        { href: '/worker/tasks', text: 'مهامي', icon: 'fa-tasks', roles: ['worker'] },
        { href: '/worker/schedule', text: 'جدولي', icon: 'fa-calendar-alt', roles: ['worker'] },
        
        // Section: General
        { title: 'عام', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/messages', text: 'الرسائل', icon: 'fa-envelope', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
        { href: '/student-finance', text: 'المالية', icon: 'fa-wallet', roles: ['student', 'parent'] },
        { href: '/performance', text: 'تقارير الأداء', icon: 'fa-chart-line', roles: ['student', 'parent'] },
        { href: '/completed-courses', text: 'السجل الدراسي', icon: 'fa-history', roles: ['student', 'parent'] },
        { href: '/profile', text: 'الملف الشخصي', icon: 'fa-user-circle', roles: ['admin', 'student', 'teacher', 'parent', 'head', 'finance', 'worker'] },
    ];

    const sidebarContent = (
        <div className="sidebar-content-wrapper">
            {!isMobile && <div className="sidebar-logo">إقامة الكتاب</div>}
            <ul className="sidebar-nav">
                {navLinks.map((link, index) => {
                    if (link.roles && (!user || !link.roles.includes(user.role))) {
                        return null;
                    }
                    if (link.title) {
                        return <li key={index} className="nav-title">{link.title}</li>;
                    }
                    return (
                        <li key={index}>
                            <Link 
                                href={link.href}
                                className={currentPath === link.href ? 'active' : ''}
                                onClick={() => {
                                    if (isMobile) {
                                        setSidebarExpanded(false);
                                    }
                                }}
                            >
                                <i className={`fas ${link.icon} fa-fw`}></i>
                                    <span className="nav-text">{link.text}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    if (isMobile) {
        return (
            <>
                {sidebarExpanded && (
                    <>
                        <div
                            className="sidebar-overlay"
                            onClick={() => setSidebarExpanded(false)}
                        ></div>
                        <div className="sidebar-expanded">
                            <div className="sidebar-expanded-header">
                                <div className="sidebar-logo">إقامة الكتاب</div>
                                <button
                                    className="sidebar-close-btn"
                                    onClick={() => setSidebarExpanded(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            {sidebarContent}
                        </div>
                    </>
                )}
            </>
        );
    }

    // Desktop sidebar
    return (
        <div className="sidebar">
             {sidebarContent}
        </div>
    );
};


const Header = ({ user, onLogout, onToggleSidebar, isMobile }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            authEndpoint: '/api/pusher/auth',
        });
        const channel = pusher.subscribe(`private-user-${user.id}`);
        channel.bind('new-notification', (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            pusher.unsubscribe(`private-user-${user.id}`);
            pusher.disconnect();
        };
    }, [user.id]);

    const handleBellClick = async () => {
        setIsDropdownOpen(!isDropdownOpen);
        if (!isDropdownOpen && unreadCount > 0) {
            try {
                await fetch('/api/notifications/mark-read', { method: 'POST' });
                setUnreadCount(0);
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        }
    };

    return (
        <header className="dashboard-header">
            <div className="header-left">
                {isMobile && (
                    <button 
                        className="sidebar-toggle"
                        onClick={onToggleSidebar}
                        aria-label="تبديل القائمة الجانبية"
                    >
                        <i className="fas fa-bars"></i>
                    </button>
                )}
                {!isMobile && <div className="header-title">لوحة التحكم</div>}
            </div>
            <div className="header-right">
                {/* Task Notification System with Fallback */}
                {process.env.NODE_ENV === 'development' ? (
                    <TaskNotificationSystemFallback userId={user.id} userRole={user.role} />
                ) : (
                    <TaskNotificationSystem userId={user.id} userRole={user.role} />
                )}
                
                {/* General Notifications */}
                <div className="notifications-bell" onClick={handleBellClick}>
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    {isDropdownOpen && (
                        <div className="notifications-dropdown show">
                            <div className="notification-header">الإشعارات العامة</div>
                            <div className="notification-list">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <Link 
                                        key={n.id} 
                                        href={n.link || '#'} 
                                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                                    >
                                        <span className="msg">{n.message}</span>
                                        <span className="time">{new Date(n.created_at).toLocaleString('ar-EG')}</span>
                                    </Link>
                                )) : <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>لا توجد إشعارات</div>}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="user-menu">
                    <span>أهلاً, {user.full_name}</span>
                    <button onClick={onLogout} title="تسجيل الخروج"><i className="fas fa-sign-out-alt"></i></button>
                </div>
            </div>
        </header>
    );
};

const Layout = ({ user = null, children }) => {
    const router = useRouter();
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setSidebarExpanded(false); // Close mobile sidebar on desktop view
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout');
        router.push('/login');
    };

    const isParentView = user?.is_view_token;
    const isPaymentLocked = user?.details?.is_payment_locked;

    // If no user, render a simple layout without sidebar/header
    if (!user) {
        return (
            <>
                <Head>
                    <title>مركز إقامة الكتاب</title>
                </Head>
                <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
                    {children}
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>لوحة التحكم - مركز إقامة الكتاب</title>
            </Head>
            <div className={`dashboard-wrapper ${!isMobile ? 'desktop-view' : ''}`}>
                <Sidebar 
                    user={user} 
                    currentPath={router.pathname} 
                    isMobile={isMobile}
                    sidebarExpanded={sidebarExpanded}
                    setSidebarExpanded={setSidebarExpanded}
                />
                <Header user={user} onLogout={handleLogout} onToggleSidebar={() => setSidebarExpanded(!sidebarExpanded)} isMobile={isMobile} />
                <main className="dashboard-main-content">
                    {isParentView && (
                        <div className="view-mode-banner">
                            <i className="fas fa-eye"></i> <strong>وضع المشاهدة:</strong> أنت الآن تتصفح لوحة تحكم: <strong>{user.full_name}</strong>.
                        </div>
                    )}
                    {isPaymentLocked && (
                         <div className="payment-lock-overlay">
                            <div className="message-box">
                                <h2><i className="fas fa-lock"></i> تم تقييد الوصول</h2>
                                <p>لقد تم تقييد وصولك إلى المنصة بسبب تأخر سداد المصروفات. يرجى التوجه إلى قسم المالية لتسوية المستحقات.</p>
                                <Link href="/finance" className="btn-primary">الذهاب إلى قسم المالية</Link>
                            </div>
                        </div>
                    )}
                    <div style={{ filter: isPaymentLocked ? 'blur(5px)' : 'none', pointerEvents: isPaymentLocked ? 'none' : 'auto', height: '100%' }}>
                        {children}
                    </div>
                </main>
            </div>
            <AIAssistant />
            <style jsx global>{`
                :root { 
                    --primary-color: #0056b3; 
                    --dark-color: #2c3e50; 
                    --light-color: #f4f7f9; 
                    --white-color: #fff; 
                    --danger-color: #e74c3c; 
                    --success-color: #27ae60;
                    --sidebar-width: 260px;
                    --sidebar-collapsed-width: 70px; 
                    --header-height: 60px; 
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    background-color: var(--light-color); 
                    overflow: hidden;
                }
                .dashboard-wrapper { 
                    display: grid; 
                    grid-template-columns: 1fr; 
                    grid-template-rows: var(--header-height) 1fr; 
                    height: 100vh; 
                    width: 100vw;
                    transition: grid-template-columns 0.3s ease;
                }
                .desktop-view {
                    grid-template-columns: var(--sidebar-width) 1fr !important;
                }
                .sidebar {
                    grid-row: 1 / -1;
                    background-color: var(--dark-color);
                    color: var(--white-color);
                    display: flex;
                    flex-direction: column;
                    z-index: 20;
                }
                .sidebar-logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    padding: 15px 20px;
                    text-align: center;
                    color: var(--white-color);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .sidebar-content-wrapper {
                    overflow-y: auto;
                    flex-grow: 1;
                }
                .sidebar-nav { 
                    list-style: none; 
                    padding: 0; 
                    margin: 0;
                }
                .sidebar-nav li a { display: block; padding: 15px 20px; color: var(--light-color); text-decoration: none; transition: background 0.2s, padding-right 0.2s; }
                .sidebar-nav li a:hover, .sidebar-nav li a.active { background-color: var(--primary-color); padding-right: 25px; }
                .sidebar-nav .nav-title { 
                    padding: 10px 20px; 
                    font-size: 0.8rem; 
                    color: #95a5a6; 
                    text-transform: uppercase; 
                    margin-top: 15px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .sidebar-nav .nav-title:first-child {
                    margin-top: 0;
                    border-top: none;
                }
                /* Custom scrollbar for sidebar */
                .sidebar-content-wrapper::-webkit-scrollbar {
                    width: 6px;
                }
                .sidebar-content-wrapper::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                }
                .sidebar-content-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 3px;
                }
                .sidebar-content-wrapper::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.5);
                }
                .dashboard-header { 
                    grid-row: 1 / 2;
                    grid-column: 1 / -1;
                    background-color: var(--white-color); 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 0 30px; 
                    border-bottom: 1px solid #e0e0e0;
                    z-index: 10;
                }
                .desktop-view .dashboard-header {
                    grid-column: 2 / -1 !important;
                }
                .header-left { display: flex; align-items: center; gap: 15px; }
                .header-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #333;
                }
                .header-right { display: flex; align-items: center; gap: 25px; }
                .sidebar-toggle {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #555;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                .sidebar-toggle:hover {
                    background-color: #f0f0f0;
                }
                .notifications-bell { position: relative; cursor: pointer; }
                .notifications-bell .fa-bell { font-size: 1.3rem; color: #555; }
                .notifications-bell .badge { position: absolute; top: -5px; right: -8px; background: var(--danger-color); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; justify-content: center; align-items: center; }
                .user-menu { display: flex; align-items: center; gap: 10px; }
                .user-menu button { background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; }
                .dashboard-main-content {
                    grid-row: 2 / -1;
                    grid-column: 1 / -1;
                    padding: 30px;
                    overflow-y: auto;
                    height: calc(100vh - var(--header-height));
                }
                .desktop-view .dashboard-main-content {
                    grid-column: 2 / -1 !important;
                }
                .notifications-dropdown { display: none; position: absolute; top: 45px; left: -150px; width: 320px; background: white; border-radius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); z-index: 100; border: 1px solid #eee; }
                .notifications-dropdown.show { display: block; }
                .notification-header { padding: 12px 15px; font-weight: bold; border-bottom: 1px solid #eee; }
                .notification-list { max-height: 350px; overflow-y: auto; }
                .notification-item { display: block; padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333; transition: background-color 0.2s; }
                .notification-item:hover { background-color: #f7f7f7; }
                .notification-item.unread { background-color: #eaf5ff; }
                .notification-item .msg { display: block; margin-bottom: 5px; font-size: 0.9rem; }
                .notification-item .time { font-size: 0.75rem; color: #888; }
                .payment-lock-overlay { position: fixed; top: 0; right: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; justify-content: center; align-items: center; text-align: center; color: white; }
                .payment-lock-overlay .message-box { background: var(--white-color); color: var(--dark-color); padding: 40px; border-radius: 8px; max-width: 500px; }
                .payment-lock-overlay .btn-primary { color: white; background: var(--primary-color); padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 15px; }
                .view-mode-banner { background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ffeeba; }
                
                /* Expanded Sidebar Overlay */
                .sidebar-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 999;
                    animation: overlayFadeIn 0.3s ease-out;
                }
                .sidebar-expanded {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 280px;
                    height: 100vh;
                    background-color: var(--dark-color);
                    color: var(--white-color);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -4px 0 20px rgba(0,0,0,0.3);
                    animation: sidebarSlideIn 0.3s ease-out;
                }
                .sidebar-expanded-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background-color: rgba(0,0,0,0.2);
                    padding: 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .sidebar-close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                .sidebar-close-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                }
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes sidebarSlideIn {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0;
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1;
                    }
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .sidebar {
                        display: none;
                    }
                    .dashboard-main-content {
                        padding: 15px !important;
                    }
                    .dashboard-header {
                        padding: 0 15px !important;
                    }
                    .header-right {
                        gap: 15px !important;
                    }
                    .user-menu span {
                        display: none;
                    }
                    /* .sidebar-expanded {
                        width: 100vw !important;
                        right: 0 !important;
                    } */
                    .sidebar-expanded-header {
                        padding: 10px 15px !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Layout;