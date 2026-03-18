import path from 'path';
import fs from 'fs';
import multer from 'multer';
import type { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
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
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
