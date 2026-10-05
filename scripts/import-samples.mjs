// Imports Chép mẫu samples pasted from another writer: node scripts/import-samples.mjs <file> [--force]
// <file> holds a JSON array of samples (or several JSON objects, with or without ```json fences).
// Each sample is written to src/content/samples/<promptId>.json and then checked by check-samples.mjs;
// samples that fail are removed again and listed with the reason, the rest are kept.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'src/content/samples');
const file = process.argv[2];
const force = process.argv.includes('--force');
if (!file) { console.error('usage: node scripts/import-samples.mjs <file> [--force]'); process.exit(2); }

let text = fs.readFileSync(file, 'utf8').replace(/```(?:json)?/gi, '');
// Typographic quotes that sometimes replace JSON's straight quotes around keys and values.
text = text.replace(/[“”](?=\s*[:,\]}])|(?<=[{\[,:]\s*)[“”]/g, '"');

/** Top-level {...} objects in the text, found by brace matching (strings respected). */
function objects(t) {
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') { if (depth++ === 0) start = i; }
    else if (c === '}' && depth > 0 && --depth === 0) out.push(t.slice(start, i + 1));
  }
  return out;
}

const samples = [];
const rejected = [];
for (const raw of objects(text)) {
  try { samples.push(JSON.parse(raw)); } catch (e) { rejected.push(['(unreadable object starting ' + JSON.stringify(raw.slice(0, 60)) + ')', e.message]); }
}

/** One sentence per line, like the hand-written samples. */
const fmt = (s) => `{
  "promptId": ${JSON.stringify(s.promptId)},
  "source": ${JSON.stringify(s.source)},
  "note": ${JSON.stringify(s.note || '')},
  "paragraphs": [
${s.paragraphs.map((p) => '    [\n' + p.map((g) => '      ' + JSON.stringify({ tool: g.tool, mark: g.mark, en: g.en, vi: g.vi })).join(',\n') + '\n    ]').join(',\n')}
  ]
}
`;

const written = [];
for (const s of samples) {
  const id = s && s.promptId;
  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) { rejected.push([String(id), 'missing or invalid promptId']); continue; }
  if (!Array.isArray(s.paragraphs) || s.paragraphs.some((p) => !Array.isArray(p))) { rejected.push([id, 'paragraphs must be an array of arrays']); continue; }
  const target = path.join(dir, id + '.json');
  if (fs.existsSync(target) && !force) { rejected.push([id, 'already has a sample (use --force to replace)']); continue; }
  s.source = s.source === 'book' ? 'book' : 'hocnoihocviet';
  const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  fs.writeFileSync(target, fmt(s));
  written.push({ id, target, previous });
}

// Check everything; drop the new files that have problems and keep the others.
const run = () => spawnSync('node', [path.join(root, 'scripts/check-samples.mjs')], { encoding: 'utf8' });
let r = run();
if (r.status !== 0) {
  const problems = (r.stderr || '').split('\n').filter((l) => /^[\w-]+\.json: /.test(l));
  for (const w of written) {
    const mine = problems.filter((l) => l.startsWith(w.id + '.json: '));
    if (!mine.length) continue;
    if (w.previous != null) fs.writeFileSync(w.target, w.previous); else fs.unlinkSync(w.target);
    rejected.push([w.id, mine.map((l) => l.slice(w.id.length + 7)).join('; ')]);
  }
  r = run();
}
const kept = written.filter((w) => fs.existsSync(w.target) && !rejected.some(([id]) => id === w.id));
console.log(`Imported ${kept.length} sample(s): ${kept.map((w) => w.id).join(', ') || 'none'}`);
if (rejected.length) { console.log(`Rejected ${rejected.length}:`); rejected.forEach(([id, why]) => console.log(`  - ${id}: ${why}`)); }
console.log((r.stdout || r.stderr || '').trim());
process.exit(rejected.length ? 1 : 0);
