#!/usr/bin/env node
/**
 * Adds .js extension to relative imports in compiled output for Node ESM.
 * Run after tsc-alias.
 */
import { readdir, readFile, writeFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

async function resolveExtension(filePath, importPath) {
  const fileDir = dirname(filePath);
  const absBase = join(fileDir, importPath);
  try {
    await access(absBase + '.js');
    return importPath + '.js';
  } catch {
    try {
      await access(join(absBase, 'index.js'));
      return importPath + '/index.js';
    } catch {
      return importPath + '.js';
    }
  }
}

async function processFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  const regex = /from\s+(['"])(\.[^'"]+)\1/g;
  const matches = [...content.matchAll(regex)];
  let changed = false;
  for (const m of matches) {
    const path = m[2];
    const hasExt = /\.(js|mjs|cjs|json)$/.test(path);
    if ((path.startsWith('./') || path.startsWith('../')) && !hasExt) {
      const resolved = await resolveExtension(filePath, path);
      content = content.replace(m[0], `from ${m[1]}${resolved}${m[1]}`);
      changed = true;
    }
  }
  if (changed) await writeFile(filePath, content);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full);
    else if (e.name.endsWith('.js')) await processFile(full);
  }
}

await walk(distDir);
console.log('Added .js extensions to relative imports');
