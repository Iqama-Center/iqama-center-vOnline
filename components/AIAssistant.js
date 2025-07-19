import React, { useState, useEffect, useRef } from 'react';

const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        { role: 'model', parts: [{ text: 'أهلاً بك! أنا مساعد إقامة الكتاب الذكي. كيف يمكنني مساعدتك اليوم؟' }] },
    ]);
    const [query, setQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        const userMessage = { role: 'user', parts: [{ text: query }] };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        setQuery('');
        setIsTyping(true);
        try {
            const response = await fetch('/api/ai-assistant/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: newHistory }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            const aiMessage = { role: 'model', parts: [{ text: result.answer }] };
            setChatHistory([...newHistory, aiMessage]);
        } catch (err) {
            const errorMessage = { role: 'model', parts: [{ text: 'عفواً، لا يمكنني الاتصال الآن. يرجى المحاولة لاحقاً.' }] };
            setChatHistory([...newHistory, errorMessage]);
        }
        setIsTyping(false);
    };

    return (
        <>
            <div className="ai-assistant-fab" onClick={() => setIsOpen(!isOpen)}>
                <i className="fas fa-robot"></i>
            </div>
            {isOpen && (
                <div className="ai-chat-window open">
                    <div className="ai-chat-header">
                        <i className="fas fa-robot"></i> مساعد إقامة الكتاب الذكي
                    </div>
                    <div className="ai-chat-body" ref={chatBodyRef}>
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                {msg.parts[0].text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-bubble ai typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        )}
                    </div>
                    <div className="ai-chat-footer">
                        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="اكتب سؤالك هنا..."
                                autoComplete="off"
                                dir="auto"
                            />
                            <button type="submit">
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <style jsx>{`
                .ai-assistant-fab {
                    position: fixed;
                    bottom: 30px;
                    left: 30px;
                    width: 60px;
                    height: 60px;
                    background-color: #0056b3;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 1.8rem;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(0, 86, 179, 0.4);
                    z-index: 999;
                    transition: transform 0.3s;
                }
                .ai-assistant-fab:hover { transform: scale(1.1); }
                .ai-chat-window {
                    position: fixed;
                    bottom: 100px;
                    left: 30px;
                    width: 350px;
                    height: 450px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                }
                .ai-chat-window.open { display: flex; }
                .ai-chat-header {
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    background: #0056b3;
                    color: white; padding: 15px;
                    border-top-left-radius: 15px; border-top-right-radius: 15px;
                    font-weight: bold;
                }
                .ai-chat-body { flex-grow: 1; padding: 15px; overflow-y: auto; }
                .ai-chat-footer { padding: 10px; border-top: 1px solid #eee; display: flex; }
                .ai-chat-footer input { flex-grow: 1; border: 1px solid #ccc; border-radius: 20px; padding: 10px 15px; }
                .ai-chat-footer button { background: none; border: none; color: #0056b3; font-size: 1.5rem; cursor: pointer; padding: 0 10px; }
                .chat-bubble { padding: 10px 15px; border-radius: 18px; margin-bottom: 10px; max-width: 80%; line-height: 1.5; }
                .chat-bubble.user { background: #007bff; color: white; margin-left: auto; border-bottom-right-radius: 4px; }
                .chat-bubble.ai { background: #f1f1f1; margin-right: auto; border-bottom-left-radius: 4px; }
                .typing-indicator span {
                    height: 8px; width: 8px; background-color: #999;
                    border-radius: 50%; display: inline-block;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .typing-indicator span:nth-of-type(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-of-type(2) { animation-delay: -0.16s; }
                @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
            `}</style>
        </>
    );
};

export default AIAssistant;
