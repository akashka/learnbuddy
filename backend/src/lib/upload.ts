import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const JD_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const RESUME_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadJd = multer({
  storage,
  limits: { fileSize: JD_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for JD'));
    }
  },
}).single('jd');

export const uploadResume = multer({
  storage,
  limits: { fileSize: RESUME_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or Word documents are allowed for resume'));
    }
  },
}).fields([
  { name: 'resume', maxCount: 1 },
]);

export { UPLOAD_DIR };
