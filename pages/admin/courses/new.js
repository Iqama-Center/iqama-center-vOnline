import React from 'react';
import Layout from '../../../components/Layout';
import CourseForm from '../../../components/CourseForm';
import { withAuth } from '../../../lib/withAuth';
import { safeProps } from '../../../lib/serializer';

const NewCoursePage = ({ user }) => {
    return (
        <Layout user={user}>
            <div className="page-container">
                <div className="page-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <i className="fas fa-plus-circle"></i>
                        </div>
                        <div className="header-text">
                            <h1>إنشاء دورة جديدة</h1>
                            <p className="header-subtitle">قم بإنشاء دورة تدريبية جديدة وتخصيص إعداداتها</p>
                        </div>
                    </div>
                </div>
                
                <div className="form-container">
                    <CourseForm />
                </div>
            </div>

            <style jsx>{`
                .page-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .page-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    color: white;
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .header-icon {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                }

                .header-icon i {
                    font-size: 2.5rem;
                    color: white;
                }

                .header-text h1 {
                    margin: 0;
                    font-size: 2.5rem;
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    font-family: 'Tajawal', sans-serif;
                }

                .header-subtitle {
                    margin: 8px 0 0 0;
                    font-size: 1.1rem;
                    opacity: 0.9;
                    font-weight: 400;
                }

                .form-container {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }

                @media (max-width: 768px) {
                    .page-container {
                        padding: 15px;
                    }

                    .page-header {
                        padding: 20px;
                        margin-bottom: 20px;
                    }

                    .header-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 15px;
                    }

                    .header-icon {
                        width: 60px;
                        height: 60px;
                    }

                    .header-icon i {
                        font-size: 2rem;
                    }

                    .header-text h1 {
                        font-size: 2rem;
                    }

                    .header-subtitle {
                        font-size: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .header-text h1 {
                        font-size: 1.8rem;
                    }

                    .header-subtitle {
                        font-size: 0.9rem;
                    }
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    // No need to fetch users here anymore since we're using Zustand store
    return {
        props: safeProps({
            user: context.user,
        })
    };
}, { roles: ['admin', 'head'] });

export default NewCoursePage;
