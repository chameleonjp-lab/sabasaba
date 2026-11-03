'use strict';
// Selected component/controller prefix only. No JSX evaluation, React import,
// framework, browser, storage, real timer, clipboard or network is executed.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const assert = require('node:assert/strict');
const raw = fs.readFileSync(path.join(__dirname, '../client/src/components/ShareButton.tsx'), 'utf8');
const end = raw.indexOf('\n  return (');
assert.ok(end > 0, 'component JSX boundary');
const prefix = raw.slice(0, end).replace(/^import [^\n]*\n/gm, '') + '\n  return { share };\n}\n';
const source = stripTypeScriptTypes(prefix, { mode: 'strip' }).replace(/^export default /gm, '').replace(/^export /gm, '') + '\nthis.makeShare = ShareButton;';

function harness(popupMode = 'blocked') {
  const slots = [], effects = [], timers = new Map(), listeners = new Map();
  const updates = [], opens = [], copies = [], trace = [], pendingCopies = [];
  let index = 0, timerId = 0, committed = true, props = { text: 'same text', label: 'X', title: 'game', testId: 'share-home', contextKey: 'home:normal:ja:1' }, api;
  function useState(initial) {
    const position = index++;
    if (!slots[position]) slots[position] = { value: initial };
    return [slots[position].value, value => { updates.push({ position, value, committed }); slots[position].value = value; }];
  }
  function useRef(initial) { const position = index++; return slots[position] || (slots[position] = { current: initial }); }
  function effect(callback, deps) {
    const position = index++, old = slots[position];
    if (!old || deps.some((value, i) => value !== old.deps[i])) effects.push(() => { if (old?.cleanup) old.cleanup(); slots[position] = { deps, cleanup: callback() }; });
  }
  let opener = {}, closed = 0, link;
  const popup = {
    close() { trace.push('close'); closed++; },
    document: {
      createElement(tag) {
        trace.push('create'); assert.equal(tag, 'a');
        if (popupMode === 'create-throws') throw Error('create');
        link = { click() { trace.push('navigate'); if (popupMode === 'navigate-throws') throw Error('navigate'); assert.equal(opener, null); assert.equal(link.target, '_self'); assert.equal(link.referrerPolicy, 'no-referrer'); assert.ok(link.rel.split(' ').includes('noreferrer')); }, remove() { trace.push('remove'); } };
        return link;
      },
      body: { append(node) { trace.push('append'); assert.equal(node, link); if (popupMode === 'append-throws') throw Error('append'); } },
    },
  };
  Object.defineProperty(popup, 'opener', {
    set(value) { trace.push('set-opener'); if (popupMode === 'set-throws') throw Error('setter'); if (popupMode !== 'opener-stays') opener = value; },
    get() { trace.push('read-opener'); if (popupMode === 'get-throws') throw Error('getter'); return opener; },
  });
  const window = {
    open(...args) { opens.push(args); trace.push('open'); if (popupMode === 'open-throws') throw Error('open'); return popupMode === 'blocked' ? null : popup; },
    setTimeout(fn, delay) { assert.equal(delay, 1800); timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
  };
  const navigator = { clipboard: { writeText(text) { copies.push(text); trace.push('copy'); return new Promise((resolve, reject) => pendingCopies.push({ resolve, reject })); } } };
  const document = { visibilityState: 'visible', addEventListener: window.addEventListener, removeEventListener: window.removeEventListener };
  const context = vm.createContext({ useState, useRef, useEffect: effect, useLayoutEffect: effect, window, document, navigator, URL, t: key => key }, { codeGeneration: { strings: false, wasm: false } });
  new vm.Script(source).runInContext(context, { timeout: 1000 });
  function render(next = {}) { props = { ...props, ...next }; index = 0; api = context.makeShare(props); while (effects.length) effects.shift()(); return api; }
  render();
  return {
    render, share: () => api.share(), opens, copies, updates, trace, pendingCopies, timers,
    installStub(script) { new vm.Script(script).runInContext(context, { timeout: 1000 }); },
    intents: () => window.shareIntents,
    state: () => ({ status: slots[0].value, pending: slots[1].value, manual: slots[2].value }),
    resetUpdates() { updates.length = 0; },
    event(type) { for (const fn of listeners.get(type) || []) fn(); },
    visibility(state) { document.visibilityState = state; for (const fn of listeners.get('visibilitychange') || []) fn(); },
    unmount() { committed = false; for (const slot of slots) if (slot.cleanup) slot.cleanup(); },
    remountEffects() { for (const slot of slots) if (slot.cleanup) slot.cleanup(); },
    closed: () => closed,
    link: () => link,
  };
}
const cases = [];
function test(name, fn) { cases.push([name, fn]); }
test('current blocked popup copy success and manual failure remain available', async () => {
  for (const fail of [false, true]) {
    const h = harness(), task = h.share(); assert.equal(h.copies.length, 1); assert.equal(h.state().pending, true);
    fail ? h.pendingCopies[0].reject(Error('denied')) : h.pendingCopies[0].resolve(); await task;
    assert.equal(h.state().pending, false);
    assert.equal(h.state().status, fail ? '下のシェア文を選択してコピーできます。' : 'シェア文をコピーしました。');
    assert.equal(h.state().manual, fail ? h.copies[0] : '');
  }
});
test('popup opens blank synchronously and verifies opener before no-referrer navigation', async () => {
  const h = harness('success'), task = h.share();
  assert.deepEqual(h.opens, [['about:blank', '_blank']]);
  assert.ok(h.trace.indexOf('read-opener') < h.trace.indexOf('navigate'));
  assert.ok(h.trace.includes('navigate'), 'navigation happened in the click turn, before awaiting');
  assert.equal(new URL(h.link().href).origin, 'https://x.com');
  assert.equal(new URL(h.link().href).searchParams.get('text'), 'same text\n#サバサバ #ゲーム制作\nhttps://chameleonjp-lab.github.io/sabasaba/');
  await task; assert.equal(h.copies.length, 0); assert.equal(h.state().pending, false);
});
test('actual isolated-browser popup stub captures the prepared child-anchor intent', async () => {
  const python = fs.readFileSync(path.join(__dirname, 'share_acceptance.py'), 'utf8');
  const stub = python.match(/STUB = '''([\s\S]*?)'''/); assert.ok(stub);
  const h = harness(); h.installStub(stub[1]); const task = h.share();
  assert.equal(h.copies.length, 0, 'browser fake must model the protected popup, not force copy fallback');
  assert.equal(h.intents().length, 1);
  const intent = new URL(h.intents()[0]); assert.equal(intent.origin, 'https://x.com'); assert.equal(intent.pathname, '/intent/post');
  assert.equal(intent.searchParams.get('text'), 'same text\n#サバサバ #ゲーム制作\nhttps://chameleonjp-lab.github.io/sabasaba/');
  await task;
});
test('failed popup privacy preparation never navigates and falls back to copy', async () => {
  for (const failure of ['open-throws', 'set-throws', 'get-throws', 'opener-stays', 'create-throws', 'append-throws']) {
    const h = harness(failure), task = h.share();
    assert.equal(h.copies.length, 1, failure); assert.equal(h.trace.includes('navigate'), false, failure);
    if (failure !== 'open-throws') assert.equal(h.closed(), 1, failure);
    h.pendingCopies[0].resolve(); await task;
  }
});
test('navigation failure closes the blank popup and preserves manual fallback', async () => {
  const h = harness('navigate-throws'), task = h.share();
  assert.equal(h.closed(), 1); assert.equal(h.copies.length, 1); h.pendingCopies[0].reject(Error('denied')); await task;
  assert.equal(h.state().manual, h.copies[0]);
});
test('same-text new context ignores old copy success and rejection', async () => {
  for (const fail of [false, true]) {
    const h = harness(), old = h.share(); h.render({ contextKey: 'home:endless:ja:1' }); h.resetUpdates();
    fail ? h.pendingCopies[0].reject(Error('denied')) : h.pendingCopies[0].resolve(); await old;
    assert.deepEqual(h.updates, []); assert.deepEqual(h.state(), { status: '', pending: false, manual: '' });
  }
});
test('text changes invalidate old copy even if the parent context key is unchanged', async () => {
  const h = harness(), old = h.share(); h.render({ text: 'translated text' }); h.resetUpdates(); h.pendingCopies[0].reject(Error('denied')); await old;
  assert.deepEqual(h.updates, []); assert.equal(h.state().manual, '');
});
test('unmounted component receives no late state update from copy or finally', async () => {
  for (const fail of [false, true]) {
    const h = harness(), old = h.share(); h.unmount(); h.resetUpdates();
    fail ? h.pendingCopies[0].reject(Error('denied')) : h.pendingCopies[0].resolve(); await old; assert.deepEqual(h.updates, []);
  }
});
test('pagehide then pageshow never revives a stale clipboard result', async () => {
  for (const fail of [false, true]) {
    const h = harness(), old = h.share(); h.event('pagehide'); h.event('pageshow'); h.resetUpdates();
    fail ? h.pendingCopies[0].reject(Error('denied')) : h.pendingCopies[0].resolve(); await old; assert.deepEqual(h.updates, []);
  }
});
test('old finally cannot unlock a newer same-text clipboard request', async () => {
  const h = harness(), old = h.share(); h.render({ contextKey: 'result:normal:ja:2' }); const newer = h.share();
  assert.equal(h.copies.length, 2); h.pendingCopies[0].resolve(); await old;
  assert.equal(h.state().pending, true); h.pendingCopies[1].reject(Error('denied')); await newer;
  assert.equal(h.state().manual, h.copies[1]); assert.equal(h.state().pending, false);
});
test('hidden then visible does not revive a late copy or allow a hidden request', async () => {
  for (const fail of [false, true]) {
    const h = harness(), old = h.share(); h.visibility('hidden'); await h.share(); assert.equal(h.copies.length, 1);
    h.visibility('visible'); h.resetUpdates();
    fail ? h.pendingCopies[0].reject(Error('denied')) : h.pendingCopies[0].resolve(); await old; assert.deepEqual(h.updates, []);
    const fresh = h.share(); assert.equal(h.copies.length, 2); h.pendingCopies[1].resolve(); await fresh;
  }
});
test('a duplicate click cannot start another pending clipboard operation', async () => {
  const h = harness(), first = h.share(); await h.share(); assert.equal(h.copies.length, 1); h.pendingCopies[0].resolve(); await first;
});
test('queued old status timer cannot erase the newer request status', async () => {
  const h = harness(), first = h.share(); h.pendingCopies[0].resolve(); await first;
  const oldTimer = [...h.timers.values()][0]; assert.equal(typeof oldTimer, 'function');
  h.render({ contextKey: 'result:normal:ja:2' }); const second = h.share(); h.pendingCopies[1].reject(Error('denied')); await second;
  h.resetUpdates(); oldTimer(); assert.deepEqual(h.updates, []); assert.equal(h.state().status, '下のシェア文を選択してコピーできます。');
});
(async () => { let failures = 0; for (const [name, fn] of cases) { try { await fn(); console.log('PASS ' + name); } catch (error) { failures++; console.error('FAIL ' + name + ': ' + error.message); } } process.exitCode = failures ? 1 : 0; })();
