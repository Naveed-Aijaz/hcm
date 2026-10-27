import multer from 'multer';
import path from 'path';

// Vercel's filesystem is read-only/ephemeral, so files cannot be written to disk.
// Files are kept in memory and (for profile pictures) stored as a small data URL.
const maxMb = Number(process.env.UPLOAD_MAX_SIZE_MB) || 1;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Math.min(maxMb, 2) * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    const okExt = /\.(jpe?g|png)$/i.test(path.extname(file.originalname));
    const okMime = /^image\/(jpeg|png)$/.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(Object.assign(new Error('Images only (jpg, jpeg, png)'), { statusCode: 400 }));
  },
});

export default upload;
