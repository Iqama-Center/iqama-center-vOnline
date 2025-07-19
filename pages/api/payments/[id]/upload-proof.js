import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف صورة'), false);
    }
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id } = req.query; // payment ID
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Use multer middleware with Promise wrapper to ensure proper response handling
    return new Promise((resolve) => {
      upload.single('payment_proof')(req, res, async (err) => {
        try {
          if (err) {
            console.error("Multer Error:", err);
            res.status(400).json({ message: err.message });
            return resolve();
          }

          if (!req.file) {
            res.status(400).json({ message: 'لم يتم رفع أي ملف.' });
            return resolve();
          }

          const paymentProofUrl = `/uploads/${req.file.filename}`;

          // Update payment status to 'pending_review' and add proof URL
          const result = await pool.query(
            `UPDATE payments SET status = 'pending_review', payment_proof_url = $1 
             WHERE id = $2 AND enrollment_id IN (
               SELECT id FROM enrollments WHERE user_id = $3
             ) RETURNING *`,
            [paymentProofUrl, id, userId]
          );

          if (result.rows.length === 0) {
            // Delete the uploaded file if payment update fails
            fs.unlink(path.join(uploadDir, req.file.filename), (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            });
            res.status(404).json({ message: 'الدفع غير موجود أو غير مصرح لك بتعديله.' });
            return resolve();
          }

          res.status(200).json({ 
            message: 'تم رفع إثبات الدفع بنجاح. بانتظار المراجعة.', 
            payment: result.rows[0] 
          });
          resolve();

        } catch (dbError) {
          console.error("Database Error:", dbError);
          // Delete the uploaded file if database operation fails
          if (req.file) {
            fs.unlink(path.join(uploadDir, req.file.filename), (unlinkErr) => {
              if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
            });
          }
          res.status(500).json({ message: 'حدث خطأ في حفظ البيانات.' });
          resolve();
        }
      });
    });

  } catch (err) {
    console.error("Upload Proof API Error:", err);
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to allow multer to handle the body
  },
};