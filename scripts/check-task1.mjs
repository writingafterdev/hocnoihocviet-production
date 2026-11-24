// Task 1 checks on the real prompts: every prompt has hints, each hint's finding passes, and known findings pass or fail as they should.
// Run: node scripts/check-task1.mjs
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = `export * from './src/features/task1/engine'; export { TASK1_PROMPTS, findTask1Prompt } from './src/content/task1';`;
const dir = mkdtempSync(join(tmpdir(), 'task1-'));
const out = join(dir, 'engine.mjs');
await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const E = await import(pathToFileURL(out).href);
writeFileSync(join(dir, 'done'), '');

let fails = 0;
const V = (id) => ({ k: 'val', id }), G = (id) => ({ k: 'group', id }), T = (id) => ({ k: 'tip', id });
const expect = (pid, row, ok, label) => {
  const pr = E.findTask1Prompt(pid), j = E.judge(pr, row);
  if (j.ok !== ok) { fails++; console.log('FAIL', pid, label || JSON.stringify(row.map((e) => e.id)), '→', j.text); }
  else if (ok) E.sentenceOf(pr, row, false); // must not throw
};

for (const pr of E.TASK1_PROMPTS) {
  const hs = E.hintsOf(pr);
  if (!hs.length) { fails++; console.log('FAIL no hints for', pr.id); }
  console.log(pr.id, '·', hs.length, 'hints:', hs.map((h) => h.feat.label).join(' | '));
}

// Known findings
expect('t1-cinema', [G('a>item:y1524'), T('cao nhất')], true);
expect('t1-cinema', [G('a'), T('tăng')], true);
expect('t1-cinema', [V('a.y1524.0'), V('a.y1524.5'), T('tăng mạnh'), T('rồi'), V('a.y1524.6'), T('giảm'), T('rồi'), V('a.y1524.10'), T('đạt đỉnh')], true, 'chain');
expect('t1-cinema', [V('a.y1524.0'), V('a.y1524.5'), T('tăng'), T('rồi'), V('a.y714.6'), T('giảm')], false, 'chain switches actor');
expect('t1-cinema', [V('a.y714.0'), V('a.y714.5'), T('tăng'), T('rồi'), V('a.y714.6'), T('vượt qua'), G('a>item:y2535')], true, 'chain ends overtaking');
expect('t1-cinema', [V('a.y1524.0'), T('mạnh'), V('a.y1524.5')], false, 'degree alone');
expect('t1-china-food', [G('a>item:salt'), T('giảm đều')], true);
expect('t1-china-food', [G('a>item:meat'), T('gấp đôi')], true);
expect('t1-china-food', [G('a>item:fish'), T('cao nhất')], true);
expect('t1-china-food', [V('a.salt.5'), T('bằng nhau'), V('a.meat.5')], true);
expect('t1-china-food', [G('a>item:meat'), T('vượt qua'), G('a>item:salt')], false, 'meat only meets salt');
expect('t1-uk-forest', [G('a>item:paper'), T('tăng')], true);
expect('t1-uk-forest', [G('a>item:pulp'), T('vượt qua'), G('a>item:sawn')], true);
expect('t1-uk-forest', [V('a.pulp.0'), V('a.pulp.1'), T('giảm'), T('rồi'), V('a.pulp.2'), T('tăng')], true, 'pulp falls then rises');
expect('t1-women-work', [G('a>item:iceland'), T('cao nhất')], true);
expect('t1-women-work', [G('a>item:canada'), T('ổn định')], true);
expect('t1-women-work', [G('a>item:turkey'), T('thấp nhất')], true);
expect('t1-women-work', [G('a>item:germany'), T('tăng đều')], true);
expect('t1-household-devices', [G('a>item:mobile'), T('cao nhất')], false, 'mobile ties computer in 1995');
expect('t1-household-devices', [G('a>item:tablet'), T('tăng mạnh')], true, 'tablet starts in 2000');
expect('t1-household-devices', [V('a.tablet.0'), T('chạm đáy')], false, 'no figure in 1995');
expect('t1-household-devices', [G('a>item:computer'), T('vượt qua'), G('a>item:mp3')], true);
expect('t1-household-devices', [G('a>item:tablet'), T('vượt qua'), G('a>item:mp3')], true);
expect('t1-household-devices', [G('a>item:mobile'), T('tăng nhiều nhất')], true);
expect('t1-household-devices', [G('a>item:computer'), T('tăng nhiều nhất')], false, 'mobile rose a bit more');

// Every hint's own recipe must be judged true where the hint can be turned into a row
for (const pr of E.TASK1_PROMPTS) for (const h of E.hintsOf(pr)) {
  const p = pr.parts.find((x) => x.id === h.part), item = (n) => p.items.find((x) => x.name === n);
  let row = null;
  if (h.feat.all) row = [G(p.id), T(h.feat.tip)];
  else if (['cao nhất', 'thấp nhất'].includes(h.feat.tip) && h.feat.items.length === 1 && !/trừ/.test(h.feat.label)) row = [G(p.id + '>item:' + item(h.feat.items[0]).id), T(h.feat.tip)];
  else if (h.feat.tip === 'vượt qua' || h.feat.tip === 'ngược chiều') row = [G(p.id + '>item:' + item(h.feat.items[0]).id), T(h.feat.tip), G(p.id + '>item:' + item(h.feat.items[1]).id)];
  else if (h.feat.tip === 'đạt đỉnh') row = [V(h.ids[0]), T('đạt đỉnh')];
  if (row) expect(pr.id, row, true, 'hint: ' + h.feat.label);
}

console.log(fails ? fails + ' failed' : 'all Task 1 checks passed');
process.exit(fails ? 1 : 0);
