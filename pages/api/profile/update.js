import pool from '../../../lib/db';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get user from token
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const {
            fullName,
            email,
            phone,
            gender,
            birth_date,
            nationality,
            country,
            otherCountryName,
            preferredLanguage,
            languages,
            parentContactOptional,
            fatherPerspective,
            motherPerspective,
            workerSpecializations
        } = req.body;

        // Prepare details object
        const details = {
            gender,
            birth_date,
            nationality,
            country: country === 'أخرى' ? otherCountryName : country,
            preferredLanguage,
            languages: typeof languages === 'string' ? languages.split(',').map(s => s.trim()) : languages,
            parentContactOptional,
            fatherPerspective,
            motherPerspective,
            workerSpecializations: workerSpecializations || []
        };

        // Update user information
        await pool.query(
            `UPDATE users 
             SET full_name = $1, email = $2, phone = $3, details = $4
             WHERE id = $5`,
            [fullName, email, phone, details, userId]
        );

        res.status(200).json({ message: 'تم تحديث المعلومات بنجاح' });
    } catch (err) {
        console.error('Profile update error:', err);
        if (err.code === '23505') { // unique_violation
            return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}