import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import errorHandler from '../../../lib/errorHandler';
import { generateVerificationToken, storeVerificationToken, sendVerificationEmail, generateSMSCode, sendSMSVerification } from '../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fullName, email, phone, password, role, details } = req.body;

  // Enhanced server-side validation
  if (!fullName || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'الرجاء ملء جميع الحقول الإلزامية.' });
  }

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com'];
    
    if (!emailRegex.test(email)) {
      return 'صيغة البريد الإلكتروني غير صحيحة';
    }
    
    const domain = email.split('@')[1];
    if (!commonDomains.includes(domain) && !domain.includes('.')) {
      return 'يرجى استخدام بريد إلكتروني من مزود خدمة معروف';
    }
    
    return null;
  };

  // Phone validation
  const validatePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^(\+?966|0)?[5-9]\d{8}$/; // Saudi format
    const intlRegex = /^\+?[1-9]\d{7,14}$/; // International format
    
    if (!phoneRegex.test(cleanPhone) && !intlRegex.test(phone)) {
      return 'رقم الهاتف غير صحيح. يرجى استخدام صيغة صحيحة';
    }
    
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return 'رقم الهاتف يجب أن يكون بين 8 و 15 رقم';
    }
    
    return null;
  };

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    return res.status(400).json({ message: emailError });
  }

  // Validate phone
  const phoneError = validatePhone(phone);
  if (phoneError) {
    return res.status(400).json({ message: phoneError });
  }


  // Security check: Prevent self-assigning privileged roles
  const allowedPublicRoles = ['student', 'parent', 'worker'];
  if (!allowedPublicRoles.includes(role)) {
    return res.status(403).json({ message: 'لا يمكن إنشاء هذا النوع من الحسابات عبر التسجيل العام. يرجى التواصل مع الإدارة.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Enhanced details object with new fields
    const enhancedDetails = {
      ...details,
      parent_contact_optional: details.parentContactOptional || '',
      father_perspective: details.fatherPerspective || '',
      mother_perspective: details.motherPerspective || '',
      registration_status: 'pending_verification', // New registrations need verification first
      registration_date: new Date().toISOString()
    };

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, details, account_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [fullName, email, phone, password_hash, role, enhancedDetails, 'pending_verification']
    );

    const userId = newUser.rows[0].id;

    // Generate and send email verification
    const emailToken = generateVerificationToken();
    await storeVerificationToken(userId, emailToken, 'email');
    await sendVerificationEmail(email, emailToken, fullName);

    // Generate and send SMS verification
    const smsCode = generateSMSCode();
    await storeVerificationToken(userId, smsCode, 'phone');
    await sendSMSVerification(phone, smsCode, fullName);

    // This part of the logic for linking a child to a parent seems to be intended for a different workflow,
    // as a parent registering themselves wouldn't have a parent_id.
    // We will keep it for now, as it might be used when an admin or a parent adds a child.
    if (role === 'student' && details && details.parent_id) {
      await pool.query(
        'INSERT INTO parent_child_relationships (parent_id, child_id) VALUES ($1, $2) ON CONFLICT (parent_id, child_id) DO NOTHING',
        [details.parent_id, newUser.rows[0].id]
      );
    }


    res.status(201).json({ 
      message: 'تم إنشاء الحساب بنجاح! تم إرسال رابط تأكيد البريد الإلكتروني ورمز تأكيد الهاتف. يرجى التحقق من بريدك الإلكتروني وهاتفك لإكمال التسجيل.',
      userId: userId
    });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      if (err.constraint === 'users_email_key') {
        return res.status(400).json({ message: 'البريد الإلكتروني مسجل بالفعل.' });
      } else {
        return res.status(400).json({ message: 'البيانات مسجلة بالفعل.' });
      }
    }
    errorHandler(err, res);
  }
}
