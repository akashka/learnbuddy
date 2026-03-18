#!/usr/bin/env tsx
/**
 * Seed documents from the docs/ folder into MongoDB.
 * Creates a "Documentation" folder and adds each file as a document visible to all roles.
 * Run: npx tsx scripts/seed-documents.ts
 * Requires MONGODB_URI in env or .env
 */
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Document, DocumentFolder } from '../src/lib/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition-platform';
const DOCS_DIR = path.join(process.cwd(), '..', 'docs');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const ALL_ROLES = ['admin', 'teacher', 'parent', 'student'];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Docs folder not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  // Create Documentation folder
  let folder = await DocumentFolder.findOne({ name: 'Documentation', parentId: null });
  if (!folder) {
    folder = await DocumentFolder.create({
      name: 'Documentation',
      parentId: null,
      allowedRoles: ALL_ROLES,
    });
    console.log('  ✓ Created Documentation folder');
  } else {
    console.log('  ✓ Documentation folder exists');
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

    // Copy file to uploads
    const newFilename = `${uuidv4()}${ext}`;
    const destPath = path.join(UPLOAD_DIR, newFilename);
    fs.copyFileSync(filepath, destPath);
    const url = `/api/uploads/${newFilename}`;

    const existing = await Document.findOne({
      name: baseName,
      folderId: folder._id,
    });

    if (existing) {
      // Add as new version if file changed (simplified: always add version 1 if none)
      if (!existing.versions || existing.versions.length === 0) {
        existing.versions = [
          {
            url,
            version: 1,
            uploadedAt: new Date(),
            originalFilename: filename,
          },
        ];
        await existing.save();
        updated++;
        console.log(`  ✓ Updated ${filename}`);
      } else {
        console.log(`  - Skip ${filename} (already has versions)`);
      }
    } else {
      await Document.create({
        name: baseName,
        folderId: folder._id,
        category: 'Documentation',
        allowedRoles: ALL_ROLES,
        versions: [
          {
            url,
            version: 1,
            uploadedAt: new Date(),
            originalFilename: filename,
          },
        ],
      });
      created++;
      console.log(`  ✓ Created ${filename}`);
    }
  }

  console.log(`\nSeeded documents: ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
