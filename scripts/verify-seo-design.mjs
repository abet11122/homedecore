import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const failures = [];
const check = (name, fn) => { try { fn(); } catch (error) { failures.push(`${name}: ${error.message}`); } };
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const htmlFiles = walk('dist').filter((file) => file.endsWith('.html'));
let pinLinks = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  check(`schema ${file}`, () => {
    assert(!html.includes('assets.pinterest.com/js/pinit.js'), 'external SDK must not replace the custom Save link');
    const ids = graph.map((node) => node['@id']).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, 'duplicate entity IDs');
    const pages = graph.filter((node) => ['WebPage', 'CollectionPage', 'ProfilePage'].includes(node['@type']));
    assert.equal(pages.length, 1, 'each document must describe one page');
    assert.equal(pages[0].url, canonical);
    assert.equal(pages[0]['@id'], `${canonical}#webpage`);
    const article = graph.find((node) => node['@type'] === 'BlogPosting');
    if (article) {
      assert.equal(article.mainEntityOfPage['@id'], pages[0]['@id']);
      assert(graph.some((node) => node['@id'] === article.author['@id']));
    }
  });
  for (const match of html.matchAll(/<a\b[^>]*href="(https:\/\/pinterest.com\/pin\/create\/button\/[^" ]*)"[^>]*>/g)) {
    pinLinks++;
    check(`Pinterest ${file}`, () => {
      const share = new URL(match[1].replace(/&amp;/g, '&'));
      assert.equal(share.searchParams.get('url'), canonical);
      assert.equal(new URL(share.searchParams.get('media')).origin, new URL(canonical).origin);
      assert(share.searchParams.get('description'));
      assert(/rel="noopener noreferrer"/.test(match[0]));
    });
  }
}
assert(pinLinks > 0, 'Pinterest links must exist in the built HTML');

const pages = await (await fetch('http://127.0.0.1:9223/json')).json();
const page = pages.find((item) => item.type === 'page');
assert(page, 'A headless Chrome page is required');
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
const exceptions = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const promise = pending.get(message.id);
    pending.delete(message.id);
    message.error ? promise?.reject(Error(message.error.message)) : promise?.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    exceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const next = ++id;
  pending.set(next, { resolve, reject });
  socket.send(JSON.stringify({ id: next, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
};
const navigate = async (route) => {
  await send('Page.navigate', { url: `http://localhost:4321${route}` });
  // Wait from Node: page timers are unavailable when testing without JS.
  for (let attempt = 0; attempt < 60; attempt++) {
    await delay(100);
    try {
      if (await evaluate(`document.readyState === 'complete' && location.pathname === ${JSON.stringify(new URL(route, 'http://localhost:4321').pathname)}`)) {
        await delay(200);
        break;
      }
    } catch { /* Navigation can replace the execution context mid-poll. */ }
  }
};
await send('Page.enable');
await send('Runtime.enable');
const responsive = [];
for (const width of [320, 1024, 1536]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
  for (const route of ['/', '/stories/', '/search/', '/post/neutral-bedroom-ideas/', '/category/bedroom/', '/contact/']) {
    await navigate(route);
    const result = await evaluate(`({route:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),h1:document.querySelectorAll('h1').length})`);
    responsive.push(result);
    check(`layout ${width} ${route}`, () => {
      assert(result.scrollWidth <= width + 1, `horizontal overflow: ${result.scrollWidth}`);
      assert.equal(result.h1, 1);
      assert.deepEqual(result.brokenImages, []);
    });
  }
}
const filters = [];
for (const route of ['/search/', '/stories/']) {
  await navigate(`${route}?q=small-bedroom&room=bedroom`);
  const result = await evaluate(`(() => {
    const root=document.querySelector('[data-story-browser]');
    const input=root.querySelector('input[type=search]');
    const visible=()=>[...root.querySelectorAll('[data-search-text]')].filter(c=>!c.hidden);
    const initial=visible().length;
    const selected=root.querySelector('button[data-room="bedroom"]').getAttribute('aria-pressed');
    input.value='small bedroom';input.dispatchEvent(new Event('input',{bubbles:true}));
    const spaces=visible().length;
    input.value='zzzznomatchingstory';input.dispatchEvent(new Event('input',{bubbles:true}));
    const empty=visible().length===0&&!root.querySelector('[data-empty-results]').hidden;
    root.querySelector('[data-reset-filters]').click();
    return {initial,selected,spaces,empty,resetCount:visible().length,total:root.querySelectorAll('[data-search-text]').length,resetDisabled:root.querySelector('[data-reset-filters]').disabled,focused:document.activeElement===input,query:location.search};
  })()`);
  filters.push({ route, ...result });
  check(`filters ${route}`, () => {
    assert(result.initial > 0);
    assert.equal(result.initial, result.spaces, 'hyphenated queries must match spaced queries');
    assert.equal(result.selected, 'true');
    assert(result.empty);
    assert.equal(result.resetCount, result.total);
    assert(result.resetDisabled && result.focused);
    assert.equal(result.query, '');
  });
}
await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 900, deviceScaleFactor: 1, mobile: true });
await navigate('/post/neutral-bedroom-ideas/?utm_source=pinterest#save');
const article = await evaluate(`(() => {
  const contents=document.querySelector('.article-contents');
  const collapsed=!contents.open;contents.querySelector('summary').click();
  const open=contents.open;
  const pin=new URL(document.querySelector('.pin-save').href);
  return {collapsed,open,pinUrl:pin.searchParams.get('url'),canonical:document.querySelector('link[rel=canonical]').href};
})()`);
check('mobile contents and clean Pinterest URL', () => {
  assert(article.collapsed && article.open);
  assert.equal(article.pinUrl, article.canonical);
  assert(!article.pinUrl.includes('?') && !article.pinUrl.includes('#'));
});
await send('Emulation.setEmulatedMedia', { media: 'print' });
const print = await evaluate(`({titleVisible:getComputedStyle(document.querySelector('h1').parentElement).display!=='none',mastheadHidden:getComputedStyle(document.querySelector('.masthead')).display==='none',grid:getComputedStyle(document.querySelector('.post-grid')).display})`);
check('print article', () => { assert(print.titleVisible && print.mastheadHidden); assert.equal(print.grid, 'block'); });
await send('Emulation.setEmulatedMedia', { media: '' });
await evaluate(`document.querySelector('.masthead details:last-of-type summary')`);
const menu = await evaluate(`(() => {const menu=[...document.querySelectorAll('.masthead details')].find(d=>d.querySelector('summary').getBoundingClientRect().width>0);menu.open=true;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));const escape=!menu.open&&document.activeElement===menu.querySelector('summary');menu.open=true;document.querySelector('h1').click();return {escape,outside:!menu.open};})()`);
check('menu dismissal', () => assert(menu.escape && menu.outside));
await send('Emulation.setScriptExecutionDisabled', { value: true });
await navigate('/post/neutral-bedroom-ideas/');
const noJs = await evaluate(`({pin:document.querySelector('.pin-save')?.href,text:document.querySelector('.article')?.textContent.length})`);
check('article without JavaScript', () => { assert(noJs.pin?.startsWith('https://pinterest.com/')); assert(noJs.text > 500); });
await send('Emulation.setScriptExecutionDisabled', { value: false });
check('browser JavaScript exceptions', () => assert.deepEqual(exceptions, []));
socket.close();
const report = { htmlPages: htmlFiles.length, pinLinks, responsive, filters, article, print, menu, noJs, exceptions, failures };
fs.mkdirSync('audits/seo-design', { recursive: true });
fs.writeFileSync('audits/seo-design/validation.json', JSON.stringify(report, null, 2) + '\n');
console.log({ htmlPages: htmlFiles.length, pinLinks, responsiveChecks: responsive.length, filters, print, menu, failures });
if (failures.length) process.exitCode = 1;
