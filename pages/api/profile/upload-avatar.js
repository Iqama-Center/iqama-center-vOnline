const nextConnect = require('next-connect');
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../../../lib/db';
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
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image file.'), false);
        }
    }
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ message: `Upload Error! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ message: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.post(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Manually invoke multer upload
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        return res.status(501).json({ message: `Upload Error! ${err.message}` });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'لم يتم رفع أي ملف.' });
      }

      const avatarUrl = `/uploads/${req.file.filename}`;

      await pool.query(
        `UPDATE users SET avatar_url = $1 WHERE id = $2`,
        [avatarUrl, userId]
      );

      res.status(200).json({ message: 'تم تحديث الصورة الشخصية بنجاح.', avatarUrl });
    });
  } catch (err) {
    console.error("Upload Avatar API Error:", err);
    if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default apiRoute;
