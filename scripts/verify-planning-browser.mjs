import fs from 'node:fs';
import assert from 'node:assert/strict';
const pages = await (await fetch('http://127.0.0.1:9223/json')).json();
const socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.onopen = resolve);
let id = 0;
const pending = new Map();
socket.onmessage = event => { const m = JSON.parse(event.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
await send('Page.enable');
const routes = ['/', '/post/bedroom-curtain-measuring-checklist/', '/post/living-room-rug-layout-checklist/', '/post/rental-entryway-without-wall-hooks/'];
try {
  for (const width of [360, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 360 });
    for (const route of routes) {
      await send('Page.navigate', { url: `http://localhost:4321${route}` });
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (await evaluate(`location.pathname === ${JSON.stringify(route)} && document.readyState === 'complete' && !!document.querySelector('h1')`)) break;
      }
      const state = await evaluate(`({ route: location.pathname, width: innerWidth, scroll: document.documentElement.scrollWidth, sheets: document.querySelectorAll('.planning-sheet').length, fields: document.querySelectorAll('.planning-sheet textarea').length, h1: document.querySelectorAll('h1').length })`);
      assert.equal(state.route, route);
      assert(state.scroll <= width + 1, JSON.stringify(state));
      assert.equal(state.h1, 1);
      if (route !== '/') {
        assert.equal(state.sheets, 1);
        assert.equal(state.fields, 4);
        assert(await evaluate(`(() => { const field = document.querySelector('textarea'); field.value = '180 cm track'; let printed = false; window.print = () => { printed = true; }; document.querySelector('.print-plan').click(); return printed && field.value === '180 cm track'; })()`));
      }
      console.log(state);
    }
  }
  await evaluate(`document.querySelector('.planning-sheet').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.mkdirSync('.astro/browser-review', { recursive: true });
  fs.writeFileSync('.astro/browser-review/planning-sheet.png', Buffer.from(screenshot.data, 'base64'));
} finally { socket.close(); }
