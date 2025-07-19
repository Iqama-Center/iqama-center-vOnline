import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import getSystemPrompt from '../../../data/ai-system-prompt';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    let user;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await pool.query('SELECT full_name, role FROM users WHERE id = $1', [decoded.id]);
        if (userResult.rows.length === 0) throw new Error('User not found');
        user = userResult.rows[0];
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token or user' });
    }
    const { history } = req.body;
    if (!history || history.length === 0) return res.status(400).json({ message: 'History is required' });
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const systemInstruction = getSystemPrompt(user);
        const chatHistoryForModel = [
            { role: 'user', parts: [{ text: systemInstruction }] },
            { role: 'model', parts: [{ text: 'فهمت. أنا جاهز لمساعدة المستخدم.' }] },
            ...history.slice(1)
        ];
        const lastUserQuery = history[history.length - 1].parts[0].text;
        const chat = model.startChat({ history: chatHistoryForModel.slice(0, -1) });
        const result = await chat.sendMessage(lastUserQuery);
        const response = await result.response;
        const answer = response.text();
        res.status(200).json({ answer });
    } catch (error) {
        res.status(500).json({ message: 'Error processing your request' });
    }
}
