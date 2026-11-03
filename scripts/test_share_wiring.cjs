'use strict';
// Read-only preservation and declared React wiring, not a React/TSX execution test.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const source = read('client/src/components/ShareButton.tsx');
assert.equal(hash(source.slice(source.indexOf('\n  return ('))), '301aadc8b794ed0a988ea8d13c7664f9b1407b19761fd7ac1f1c0649979bcb00', 'button/disabled/manual-text/focus/live-status JSX must stay unchanged');
let parent = read('client/src/components/GameCanvas.tsx');
for (const context of ['home:${selectedMode}:${language}:${rankingRunIdRef.current}', 'result:${currentMode}:${language}:${rankingRunIdRef.current}']) {
  const prop = ' contextKey={`' + context + '`}';
  assert.equal(parent.split(prop).length - 1, 1, 'exact context prop is wired once');
  parent = parent.replace(prop, '');
}
assert.equal(hash(parent), '68b9f9ef158974586fce9212e5d827f13fac69230e30c7cdd053ee64956c0d9f', 'GameCanvas outside the two share context props is original');
assert.ok(source.includes('}, [contextKey, text]);'), 'lifecycle effect receives both context and text');
for (const [file, expected] of Object.entries({
  'client/src/game/rules.ts': '32a609e52120f7570e5bebe080680b5c24a14324e371efbd188c1c026d289364',
  'client/src/hooks/useGameRanking.ts': '2a6336c1f391e472f4afbd7db1c2863ef4a8678cda2d315484835bf734a2eb40',
  'client/src/index.css': 'b4e409a1832bb6bcb96e32ad9f407fae5bf57d99489e2c3758e2f7247add68f0',
  'vite.config.ts': '878403dc507fd73929eb4c40e31a2c3de7066da13a230aea9e4b62f95852583f',
  '.github/workflows/deploy-pages.yml': '777f1ac55f491af9b24a3c243a1d4611161ce1e768184854a9cb3df7086a201b',
  '.github/workflows/result-ui.yml': 'b1eed191859fe53f232bbc7ea7ed671d7af98392334839985cd7f470fac40986',
})) assert.equal(hash(read(file)), expected, file + ' unchanged');
const browser = read('scripts/verify-result-ui.py');
assert.ok(browser.includes('from share_acceptance import verify_extra, STUB'));
assert.equal(browser.split('page.evaluate(STUB)').length - 1, 1);
assert.ok(browser.includes('new URL(window.shareIntents[0]).searchParams.get(\\"text\\")'));
assert.ok(browser.includes('assert page.evaluate("window.testCopies[0]") == shared'));
assert.ok(browser.includes('manual.wait_for(); assert manual.input_value() == shared'));
console.log('PASS static context wiring, original JSX/game/API/CSS/workflow/config preservation, shared browser fake wiring; no React or browser execution');
