import React, { useState, useEffect, useCallback } from 'react';

const CourseMessages = ({ courseId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState('general');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replies, setReplies] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [courseId, fetchMessages]);

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`/api/courses/${courseId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    }, [courseId]);

    const fetchReplies = async (messageId) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/replies?message_id=${messageId}`);
            if (response.ok) {
                const data = await response.json();
                setReplies(prev => ({ ...prev, [messageId]: data }));
            }
        } catch (err) {
            console.error('Error fetching replies:', err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newMessage,
                    message_type: messageType,
                    parent_message_id: replyingTo
                })
            });

            if (response.ok) {
                const newMsg = await response.json();
                if (replyingTo) {
                    // Add to replies
                    setReplies(prev => ({
                        ...prev,
                        [replyingTo]: [...(prev[replyingTo] || []), newMsg]
                    }));
                } else {
                    // Add to main messages
                    setMessages(prev => [newMsg, ...prev]);
                }
                setNewMessage('');
                setReplyingTo(null);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
        setLoading(false);
    };

    const toggleReplies = (messageId) => {
        if (replies[messageId]) {
            // Hide replies
            const newReplies = { ...replies };
            delete newReplies[messageId];
            setReplies(newReplies);
        } else {
            // Fetch and show replies
            fetchReplies(messageId);
        }
    };

    const getMessageTypeIcon = (type) => {
        const icons = {
            'general': '💬',
            'announcement': '📢',
            'question': '❓'
        };
        return icons[type] || '💬';
    };

    const getRoleColor = (role) => {
        const colors = {
            'admin': '#dc3545',
            'head': '#fd7e14',
            'teacher': '#007bff',
            'student': '#28a745'
        };
        return colors[role] || '#6c757d';
    };

    return (
        <div className="course-messages">
            <style jsx>{`
                .course-messages {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: var(--shadow-md);
                    overflow: hidden;
                }
                .messages-header {
                    background: var(--primary-color);
                    color: white;
                    padding: 15px 20px;
                    font-weight: 500;
                }
                .message-form {
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
                .message-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-family: var(--font-tajawal);
                    resize: vertical;
                    min-height: 80px;
                }
                .message-type-select {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-family: var(--font-tajawal);
                }
                .form-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: 500;
                }
                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .messages-list {
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 20px;
                }
                .message-item {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .message-item:last-child {
                    border-bottom: none;
                }
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .message-author {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .author-name {
                    font-weight: 500;
                }
                .author-role {
                    font-size: 0.8rem;
                    padding: 2px 6px;
                    border-radius: 3px;
                    color: white;
                }
                .message-time {
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                .message-content {
                    margin: 10px 0;
                    line-height: 1.5;
                }
                .message-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }
                .action-btn {
                    background: none;
                    border: none;
                    color: var(--primary-color);
                    cursor: pointer;
                    font-size: 0.9rem;
                    padding: 5px;
                }
                .action-btn:hover {
                    text-decoration: underline;
                }
                .replies-section {
                    margin-top: 15px;
                    padding-left: 30px;
                    border-left: 3px solid #e9ecef;
                }
                .reply-item {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                }
                .reply-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                }
                .reply-author {
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                .reply-time {
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                .reply-content {
                    font-size: 0.9rem;
                    line-height: 1.4;
                }
                .replying-indicator {
                    background: #e3f2fd;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-size: 0.9rem;
                    color: #1976d2;
                }
                .no-messages {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                }
            `}</style>

            <div className="messages-header">
                💬 مساحة المشاركة العامة
            </div>

            <form className="message-form" onSubmit={sendMessage}>
                {replyingTo && (
                    <div className="replying-indicator">
                        📝 الرد على رسالة...
                        <button 
                            type="button" 
                            className="action-btn" 
                            onClick={() => setReplyingTo(null)}
                            style={{ marginLeft: '10px' }}
                        >
                            ❌ إلغاء
                        </button>
                    </div>
                )}

                <div className="form-group">
                    <label>نوع الرسالة</label>
                    <select 
                        className="message-type-select"
                        value={messageType}
                        onChange={(e) => setMessageType(e.target.value)}
                    >
                        <option value="general">رسالة عامة</option>
                        <option value="announcement">إعلان</option>
                        <option value="question">سؤال</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>الرسالة</label>
                    <textarea
                        className="message-input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        required
                    />
                </div>

                <div className="form-actions">
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading || !newMessage.trim()}
                    >
                        {loading ? '⏳ جاري الإرسال...' : '📤 إرسال'}
                    </button>
                </div>
            </form>

            <div className="messages-list">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <i className="fas fa-comments fa-3x" style={{ marginBottom: '15px', color: '#dee2e6' }}></i>
                        <h4>لا توجد رسائل بعد</h4>
                        <p>كن أول من يبدأ المحادثة!</p>
                    </div>
                ) : (
                    messages.map(message => (
                        <div key={message.id} className="message-item">
                            <div className="message-header">
                                <div className="message-author">
                                    <span className="message-type-icon">
                                        {getMessageTypeIcon(message.message_type)}
                                    </span>
                                    <span className="author-name">{message.author_name}</span>
                                    <span 
                                        className="author-role"
                                        style={{ backgroundColor: getRoleColor(message.author_role) }}
                                    >
                                        {message.author_role}
                                    </span>
                                </div>
                                <span className="message-time">
                                    {new Date(message.created_at).toLocaleString('ar-SA')}
                                </span>
                            </div>

                            <div className="message-content">
                                {message.message}
                            </div>

                            <div className="message-actions">
                                <button 
                                    className="action-btn"
                                    onClick={() => setReplyingTo(message.id)}
                                >
                                    💬 رد
                                </button>
                                
                                {message.reply_count > 0 && (
                                    <button 
                                        className="action-btn"
                                        onClick={() => toggleReplies(message.id)}
                                    >
                                        {replies[message.id] ? '🔼' : '🔽'} 
                                        {message.reply_count} رد
                                    </button>
                                )}
                            </div>

                            {replies[message.id] && (
                                <div className="replies-section">
                                    {replies[message.id].map(reply => (
                                        <div key={reply.id} className="reply-item">
                                            <div className="reply-header">
                                                <span className="reply-author">{reply.author_name}</span>
                                                <span className="reply-time">
                                                    {new Date(reply.created_at).toLocaleString('ar-SA')}
                                                </span>
                                            </div>
                                            <div className="reply-content">{reply.message}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseMessages;