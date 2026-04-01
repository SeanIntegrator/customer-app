import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const MAX_LINES = 1300;
const ALLOWED_FETCH_FILES = new Set([
  path.normalize(path.join('src', 'lib', 'api.js')),
  path.normalize(path.join('src', 'context', 'AuthContext.jsx')),
]);
const ALLOWED_TOKEN_LITERAL_FILES = new Set([
  path.normalize(path.join('src', 'context', 'AuthContext.jsx')),
]);

/** @param {string} dir */
function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...walk(full));
    } else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.jsx'))) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const abs of walk(SRC)) {
  const rel = path.normalize(path.relative(ROOT, abs));
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split(/\r?\n/);

  if (lines.length > MAX_LINES) {
    violations.push(`${rel}: ${lines.length} lines exceeds max ${MAX_LINES}`);
  }

  if (content.includes("sessionStorage.getItem('auth_token')") && !ALLOWED_TOKEN_LITERAL_FILES.has(rel)) {
    violations.push(`${rel}: direct auth_token sessionStorage access is not allowed`);
  }

  if (content.includes('fetch(') && !ALLOWED_FETCH_FILES.has(rel)) {
    violations.push(`${rel}: direct fetch() is not allowed outside API/Auth boundary`);
  }
}

if (violations.length > 0) {
  console.error('Quality guardrail violations found:\n');
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log('Quality guardrails passed.');
