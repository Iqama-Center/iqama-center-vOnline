import React, { useState, useEffect } from 'react';

const DailyCommitments = ({ user, initialCommitments = {} }) => {
    const [commitments, setCommitments] = useState(initialCommitments);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Default commitment items based on user role
    const getCommitmentItems = () => {
        const baseItems = {
            fajr_prayer: 'صلاة الفجر',
            morning_athkar: 'أذكار الصباح',
            quran_reading: 'قراءة القرآن',
            evening_athkar: 'أذكار المساء',
            night_prayers: 'صلاة الليل'
        };

        if (user.role === 'student') {
            return {
                ...baseItems,
                homework_review: 'مراجعة الواجبات',
                lesson_preparation: 'تحضير الدرس القادم'
            };
        }

        if (user.role === 'teacher') {
            return {
                ...baseItems,
                lesson_planning: 'تحضير الدروس',
                student_feedback: 'متابعة الطلاب'
            };
        }

        return baseItems;
    };

    const commitmentItems = getCommitmentItems();

    const handleCommitmentChange = (key, value) => {
        setCommitments(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveCommitments = async () => {
        if (Object.keys(commitments).length === 0) {
            setMessage('الرجاء توفير اسم الالتزام وحالته');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/commitments/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commitments })
            });

            const result = await response.json();
            
            if (response.ok) {
                setMessage('✅ تم حفظ التعاهد اليومي بنجاح');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ ' + (result.message || 'حدث خطأ'));
            }
        } catch (err) {
            setMessage('❌ خطأ في الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const getCompletionPercentage = () => {
        const total = Object.keys(commitmentItems).length;
        const completed = Object.values(commitments).filter(Boolean).length;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    const percentage = getCompletionPercentage();

    return (
        <div className="daily-commitments">
            <div className="commitments-header">
                <h3>📋 التعاهد اليومي</h3>
                <div className="progress-circle">
                    <div className="progress-text">{percentage}%</div>
                </div>
            </div>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="commitments-list">
                {Object.entries(commitmentItems).map(([key, label]) => (
                    <div key={key} className="commitment-item">
                        <label className="commitment-label">
                            <input
                                type="checkbox"
                                checked={commitments[key] || false}
                                onChange={(e) => handleCommitmentChange(key, e.target.checked)}
                                className="commitment-checkbox"
                            />
                            <span className="checkmark"></span>
                            <span className="commitment-text">{label}</span>
                        </label>
                    </div>
                ))}
            </div>

            <button 
                onClick={saveCommitments} 
                disabled={loading}
                className="save-commitments-btn"
            >
                {loading ? '⏳ جاري الحفظ...' : '💾 حفظ التعاهد'}
            </button>

            <style jsx>{`
                .daily-commitments {
                    background: var(--white-color);
                    border-radius: var(--border-radius-lg);
                    padding: var(--spacing-6);
                    box-shadow: var(--shadow-md);
                    border: 1px solid var(--gray-200);
                }

                .commitments-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--spacing-5);
                }

                .commitments-header h3 {
                    margin: 0;
                    color: var(--primary-color);
                    font-size: var(--font-size-xl);
                }

                .progress-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: conic-gradient(
                        var(--success-color) ${percentage * 3.6}deg,
                        var(--gray-200) ${percentage * 3.6}deg
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .progress-circle::before {
                    content: '';
                    position: absolute;
                    width: 45px;
                    height: 45px;
                    background: var(--white-color);
                    border-radius: 50%;
                }

                .progress-text {
                    position: relative;
                    z-index: 1;
                    font-weight: 700;
                    font-size: var(--font-size-sm);
                    color: var(--gray-700);
                }

                .message {
                    padding: var(--spacing-3);
                    border-radius: var(--border-radius);
                    margin-bottom: var(--spacing-4);
                    text-align: center;
                    font-weight: 500;
                }

                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .commitments-list {
                    margin-bottom: var(--spacing-5);
                }

                .commitment-item {
                    margin-bottom: var(--spacing-3);
                }

                .commitment-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    padding: var(--spacing-3);
                    border-radius: var(--border-radius);
                    transition: background var(--transition-fast);
                    position: relative;
                }

                .commitment-label:hover {
                    background: var(--gray-50);
                }

                .commitment-checkbox {
                    display: none;
                }

                .checkmark {
                    width: 24px;
                    height: 24px;
                    border: 2px solid var(--gray-300);
                    border-radius: var(--border-radius-sm);
                    margin-left: var(--spacing-3);
                    position: relative;
                    transition: all var(--transition-fast);
                    flex-shrink: 0;
                }

                .commitment-checkbox:checked + .checkmark {
                    background: var(--success-color);
                    border-color: var(--success-color);
                }

                .commitment-checkbox:checked + .checkmark::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                }

                .commitment-text {
                    font-size: var(--font-size-base);
                    color: var(--gray-700);
                    transition: color var(--transition-fast);
                }

                .commitment-checkbox:checked ~ .commitment-text {
                    color: var(--success-color);
                    font-weight: 500;
                }

                .save-commitments-btn {
                    width: 100%;
                    padding: var(--spacing-4);
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                    color: white;
                    border: none;
                    border-radius: var(--border-radius);
                    font-size: var(--font-size-base);
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-base);
                    box-shadow: var(--shadow-sm);
                }

                .save-commitments-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, var(--primary-dark), var(--primary-color));
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }

                .save-commitments-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                @media (max-width: 768px) {
                    .commitments-header {
                        flex-direction: column;
                        gap: var(--spacing-3);
                        text-align: center;
                    }

                    .commitment-label {
                        padding: var(--spacing-4);
                    }

                    .commitment-text {
                        font-size: var(--font-size-lg);
                    }
                }
            `}</style>
        </div>
    );
};

export default DailyCommitments;