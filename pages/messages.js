import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { useRouter } from 'next/router';

const MessagesPage = ({ user, initialConversations }) => {
    const [conversations, setConversations] = useState(initialConversations);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkForm, setBulkForm] = useState({
        recipients: 'all_heads',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (activeConversation) {
            fetch(`/api/messages/${activeConversation.contact_id}`)
                .then(res => res.json())
                .then(data => setMessages(data.messages || []));
        }
    }, [activeConversation]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            const response = await fetch(`/api/messages/${activeConversation.contact_id}` , {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });
            if (response.ok) {
                const sentMessage = await response.json();
                setMessages(prev => [...prev, sentMessage]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleBulkMessage = async (e) => {
        e.preventDefault();
        setSending(true);
        
        try {
            const response = await fetch('/api/admin/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkForm)
            });
            
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                setShowBulkModal(false);
                setBulkForm({ recipients: 'all_heads', subject: '', message: '' });
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('حدث خطأ في الإرسال');
        }
        setSending(false);
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .messaging-container { display: flex; height: calc(100vh - 200px); background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .conversations-list { width: 300px; border-left: 1px solid #eee; overflow-y: auto; }
                .conversation-item { padding: 15px; cursor: pointer; border-bottom: 1px solid #eee; }
                .conversation-item.active { background: #f0f7ff; }
                .chat-window { flex: 1; display: flex; flex-direction: column; }
                .chat-header { padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; }
                .messages-area { flex: 1; padding: 20px; overflow-y: auto; }
                .message-form { padding: 20px; border-top: 1px solid #eee; }
                .messages-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .bulk-message-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                .bulk-message-btn:hover { background: #218838; }
                .bulk-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .bulk-modal-content { background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-control { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; }
                textarea.form-control { resize: vertical; min-height: 100px; }
                .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
                .btn-primary { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
                .btn-secondary { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            `}</style>
            <div className="messages-header">
                <h1><i className="fas fa-comments fa-fw"></i> الرسائل</h1>
                {user.role === 'admin' && (
                    <button onClick={() => setShowBulkModal(true)} className="bulk-message-btn">
                        <i className="fas fa-bullhorn"></i> إرسال رسالة جماعية
                    </button>
                )}
            </div>
            <div className="messaging-container">
                <div className="conversations-list">
                    {conversations.map(convo => (
                        <div key={convo.contact_id} 
                             className={`conversation-item ${activeConversation?.contact_id === convo.contact_id ? 'active' : ''}`}
                             onClick={() => setActiveConversation(convo)}>
                            {convo.contact_name}
                        </div>
                    ))}
                </div>
                <div className="chat-window">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">{activeConversation.contact_name}</div>
                            <div className="messages-area">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}>
                                        <p>{msg.content}</p>
                                        <small>{new Date(msg.sent_at).toLocaleTimeString()}</small>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendMessage} className="message-form">
                                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." />
                                <button type="submit">إرسال</button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px' }}>اختر محادثة لعرض الرسائل.</div>
                    )}
                </div>
            </div>

            {/* Bulk Message Modal */}
            {showBulkModal && (
                <div className="bulk-modal">
                    <div className="bulk-modal-content">
                        <h3>إرسال رسالة جماعية</h3>
                        <form onSubmit={handleBulkMessage}>
                            <div className="form-group">
                                <label>المستقبلون:</label>
                                <select 
                                    className="form-control"
                                    value={bulkForm.recipients}
                                    onChange={(e) => setBulkForm({...bulkForm, recipients: e.target.value})}
                                >
                                    <option value="all_heads">جميع رؤساء الأقسام</option>
                                    <option value="all_workers">جميع العاملين</option>
                                    <option value="all_users">جميع المستخدمين</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>الموضوع:</label>
                                <input 
                                    type="text"
                                    className="form-control"
                                    value={bulkForm.subject}
                                    onChange={(e) => setBulkForm({...bulkForm, subject: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>الرسالة:</label>
                                <textarea 
                                    className="form-control"
                                    value={bulkForm.message}
                                    onChange={(e) => setBulkForm({...bulkForm, message: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" disabled={sending} className="btn-primary">
                                    {sending ? 'جاري الإرسال...' : 'إرسال'}
                                </button>
                                <button type="button" onClick={() => setShowBulkModal(false)} className="btn-secondary">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    const conversationsRes = await pool.query(`
        SELECT * FROM get_user_conversations($1);
    `, [user.id]);

    return {
        props: {
            user,
            initialConversations: JSON.parse(JSON.stringify(conversationsRes.rows))
        }
    };
});

export default MessagesPage;