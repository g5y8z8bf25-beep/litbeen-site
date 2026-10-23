import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const allowPlaceholder = process.argv.includes('--allow-placeholder');
const required = ['index.html', 'privacy/index.html', 'support/index.html', 'assets/styles.css', 'assets/litbeen-icon.png'];
const errors = [];

for (const path of required) {
  try {
    const info = await stat(join(root, path));
    if (!info.isFile() || info.size === 0) errors.push(`${path} is missing or empty.`);
  } catch {
    errors.push(`${path} is missing.`);
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(root);
for (const file of files) {
  const path = relative(root, file);
  if (/\.(?:pem|p12|mobileprovision|cer|key)$/i.test(path)) {
    errors.push(`Sensitive certificate or key material must not be published: ${path}`);
  }
  if (extname(file) !== '.html') continue;
  const html = await readFile(file, 'utf8');
  if (!html.includes('name="viewport"')) errors.push(`${path} has no mobile viewport metadata.`);
  if (/<script\b/i.test(html)) errors.push(`${path} unexpectedly includes JavaScript.`);
  if (!allowPlaceholder && html.includes('{{SUPPORT_EMAIL}}')) {
    errors.push(`${path} still contains the support-email placeholder.`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|#)/.test(value)) continue;
    const clean = value.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = resolve(file, '..', clean);
    let existing = target;
    try {
      if ((await stat(target)).isDirectory()) existing = join(target, 'index.html');
      await stat(existing);
    } catch {
      errors.push(`${path} has a broken local reference: ${value}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} public website files.`);
}
