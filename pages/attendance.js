import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';

const AttendancePage = ({ user, courses, attendanceData }) => {
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedCourse) {
            fetchStudents();
            fetchAttendance();
        }
    }, [selectedCourse, selectedDate, fetchStudents, fetchAttendance]);

    const fetchStudents = useCallback(async () => {
        try {
            const response = await fetch(`/api/courses/${selectedCourse}/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        }
    }, [selectedCourse]);

    const fetchAttendance = useCallback(async () => {
        try {
            const response = await fetch(`/api/attendance?course_id=${selectedCourse}&date=${selectedDate}`);
            if (response.ok) {
                const data = await response.json();
                setAttendanceRecords(data.attendance || []);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    }, [selectedCourse, selectedDate]);

    const handleAttendanceChange = (studentId, field, value) => {
        setAttendanceRecords(prev => {
            const existing = prev.find(r => r.student_id === studentId);
            if (existing) {
                return prev.map(r => 
                    r.student_id === studentId 
                        ? { ...r, [field]: value }
                        : r
                );
            } else {
                return [...prev, { student_id: studentId, [field]: value, status: 'present' }];
            }
        });
    };

    const saveAttendance = async () => {
        if (!selectedCourse || !selectedDate) {
            alert('يرجى اختيار الدورة والتاريخ');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/attendance/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: selectedCourse,
                    session_date: selectedDate,
                    attendance_records: attendanceRecords
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert('تم حفظ الحضور بنجاح');
            } else {
                alert(result.message || 'حدث خطأ');
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال');
        }
        setLoading(false);
    };

    if (!['teacher', 'admin', 'head'].includes(user.role)) {
        return (
            <Layout user={user}>
                <h1>غير مصرح</h1>
                <p>ليس لديك صلاحية للوصول لهذه الصفحة.</p>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <h1><i className="fas fa-user-check fa-fw"></i> تسجيل الحضور والغياب</h1>
            
            <div className="controls-section">
                <div className="form-group">
                    <label>اختر الدورة:</label>
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="form-control"
                    >
                        <option value="">-- اختر دورة --</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>التاريخ:</label>
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="form-control"
                    />
                </div>
            </div>

            {selectedCourse && students.length > 0 && (
                <div className="attendance-table-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>اسم الطالب</th>
                                <th>الحضور</th>
                                <th>التأخير (دقائق)</th>
                                <th>درجة السلوك (1-5)</th>
                                <th>درجة المشاركة (1-5)</th>
                                <th>ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const record = attendanceRecords.find(r => r.student_id === student.id) || {};
                                return (
                                    <tr key={student.id}>
                                        <td>{student.full_name}</td>
                                        <td>
                                            <select 
                                                value={record.status || 'present'}
                                                onChange={(e) => handleAttendanceChange(student.id, 'status', e.target.value)}
                                                className="form-control"
                                            >
                                                <option value="present">حاضر</option>
                                                <option value="absent">غائب</option>
                                                <option value="late">متأخر</option>
                                                <option value="excused">غياب بعذر</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="60"
                                                value={record.late_minutes || ''}
                                                onChange={(e) => handleAttendanceChange(student.id, 'late_minutes', e.target.value)}
                                                className="form-control"
                                                disabled={record.status !== 'late'}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                value={record.behavior_score || ''}
                                                onChange={(e) => handleAttendanceChange(student.id, 'behavior_score', e.target.value)}
                                                className="form-control"
                                            >
                                                <option value="">--</option>
                                                <option value="5">ممتاز (5)</option>
                                                <option value="4">جيد جداً (4)</option>
                                                <option value="3">جيد (3)</option>
                                                <option value="2">مقبول (2)</option>
                                                <option value="1">ضعيف (1)</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select 
                                                value={record.participation_score || ''}
                                                onChange={(e) => handleAttendanceChange(student.id, 'participation_score', e.target.value)}
                                                className="form-control"
                                            >
                                                <option value="">--</option>
                                                <option value="5">ممتاز (5)</option>
                                                <option value="4">جيد جداً (4)</option>
                                                <option value="3">جيد (3)</option>
                                                <option value="2">مقبول (2)</option>
                                                <option value="1">ضعيف (1)</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                value={record.notes || ''}
                                                onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                                                className="form-control"
                                                placeholder="ملاحظات..."
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="save-section">
                        <button 
                            onClick={saveAttendance} 
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ الحضور'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .controls-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                .form-group label {
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-control {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .attendance-table-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    overflow-x: auto;
                }
                .attendance-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .attendance-table th,
                .attendance-table td {
                    padding: 12px;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                }
                .attendance-table th {
                    background: #f8f9fa;
                    font-weight: bold;
                    position: sticky;
                    top: 0;
                }
                .attendance-table tr:hover {
                    background: #f8f9fa;
                }
                .save-section {
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #eee;
                }
                .btn-primary {
                    background: #0056b3;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.3s;
                }
                .btn-primary:hover:not(:disabled) {
                    background: #004494;
                }
                .btn-primary:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                @media (max-width: 768px) {
                    .controls-section {
                        grid-template-columns: 1fr;
                    }
                    .attendance-table {
                        font-size: 12px;
                    }
                    .attendance-table th,
                    .attendance-table td {
                        padding: 8px 4px;
                    }
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;

    if (!['teacher', 'admin', 'head'].includes(user.role)) {
        return {
            redirect: {
                destination: '/dashboard',
                permanent: false,
            },
        };
    }

    // Get courses the user can manage
    let coursesQuery = '';
    let queryParams = [];

    if (user.role === 'teacher') {
        coursesQuery = 'SELECT id, name FROM courses WHERE created_by = $1 AND status = \'active\'';
        queryParams = [user.id];
    } else {
        coursesQuery = 'SELECT id, name FROM courses WHERE status = \'active\'';
    }

    const coursesResult = await pool.query(coursesQuery, queryParams);

    return {
        props: {
            user,
            courses: JSON.parse(JSON.stringify(coursesResult.rows))
        }
    };
});

export default AttendancePage;