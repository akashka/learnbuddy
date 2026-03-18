import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from '@/lib/next-compat';
import connectDB from '@/lib/db';
import { Document, DocumentFolder } from '@/lib/models';

const DOCS_DIR = path.join(process.cwd(), '..', 'docs');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const ALL_ROLES = ['admin', 'teacher', 'parent', 'student'];

/** Seed documents from docs/ folder - visible to all roles */
export async function POST() {
  try {
    if (!fs.existsSync(DOCS_DIR)) {
      return NextResponse.json({ error: 'Docs folder not found' }, { status: 400 });
    }

    await connectDB();
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    let folder = await DocumentFolder.findOne({ name: 'Documentation', parentId: null });
    if (!folder) {
      folder = await DocumentFolder.create({
        name: 'Documentation',
        parentId: null,
        allowedRoles: ALL_ROLES,
      });
    }

    const files = fs.readdirSync(DOCS_DIR).filter((f) => {
      const stat = fs.statSync(path.join(DOCS_DIR, f));
      return stat.isFile();
    });

    let created = 0;
    let updated = 0;

    for (const filename of files) {
      const filepath = path.join(DOCS_DIR, filename);
      const ext = path.extname(filename);
      const baseName = path.basename(filename, ext);

      const newFilename = `${uuidv4()}${ext}`;
      const destPath = path.join(UPLOAD_DIR, newFilename);
      fs.copyFileSync(filepath, destPath);
      const url = `/api/uploads/${newFilename}`;

      const existing = await Document.findOne({
        name: baseName,
        folderId: folder._id,
      });

      if (existing) {
        if (!existing.versions || existing.versions.length === 0) {
          existing.versions = [
            { url, version: 1, uploadedAt: new Date(), originalFilename: filename },
          ];
          await existing.save();
          updated++;
        }
      } else {
        await Document.create({
          name: baseName,
          folderId: folder._id,
          category: 'Documentation',
          allowedRoles: ALL_ROLES,
          versions: [
            { url, version: 1, uploadedAt: new Date(), originalFilename: filename },
          ],
        });
        created++;
      }
    }

    return NextResponse.json({
      message: 'Documents seeded successfully',
      created,
      updated,
      total: files.length,
    });
  } catch (error) {
    console.error('Seed documents error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
