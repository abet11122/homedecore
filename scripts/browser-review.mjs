import fs from 'node:fs';

const pages=await (await fetch('http://127.0.0.1:9223/json')).json();
const page=pages.find(p=>p.type==='page');if(!page)throw Error('No headless browser page');
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;const pending=new Map();const events=[];
socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}else events.push(m);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
const evalJs=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
if(process.argv.includes('--close')){await send('Browser.close');socket.close();process.exit(0);}
await send('Page.enable');await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.auditMetrics={lcp:0,cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.auditMetrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.auditMetrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});`});
const routes=['/','/post/green-christmas-decor-ideas/','/post/small-entryway-ideas/','/post/neutral-bedroom-ideas/','/about/','/contact/','/search/','/terms/'];
const results=[];
for(const width of [360,768,1440])for(const route of routes){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
 await send('Page.navigate',{url:`http://localhost:4321${route}`});
 await evalJs(`new Promise(resolve=>{const poll=()=>document.readyState==='complete'?setTimeout(resolve,400):setTimeout(poll,100);poll();setTimeout(resolve,10000);})`);
 const result=await evalJs(`({route:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,imagesBroken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),remoteImages:[...document.images].filter(i=>new URL(i.src).origin!==location.origin).map(i=>i.src),metrics:window.auditMetrics,domContentLoaded:performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd})`);
 result.requestedWidth=width;
 results.push(result);
 if(width===360&&['/','/post/green-christmas-decor-ideas/','/about/'].includes(route)){const shot=await send('Page.captureScreenshot',{format:'png'});fs.mkdirSync('.astro/browser-review/screenshots',{recursive:true});fs.writeFileSync(`.astro/browser-review/screenshots/${route==='/'?'home':route.split('/').filter(Boolean).at(-1)}-360.png`,Buffer.from(shot.data,'base64'));}
}
await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:'http://localhost:4321/search/'});
await evalJs(`new Promise(r=>setTimeout(r,1000))`);
const search=await evalJs(`(()=>{const q=document.querySelector('#q');q.value='bedroom';q.dispatchEvent(new Event('input',{bubbles:true}));return {count:document.querySelector('#count')?.textContent,visible:[...document.querySelectorAll('.result')].filter(c=>!c.hidden).length};})()`);
fs.writeFileSync('audits/adsense/browser-validation.json',JSON.stringify({environment:'Local Astro dev, unthrottled headless Chrome. Lab observations, not field Core Web Vitals or a Lighthouse score.',results,search},null,2)+'\n');
const failures=results.filter(r=>r.scrollWidth>r.requestedWidth+1||r.imagesBroken.length||r.remoteImages.length||r.h1!==1);
console.log({checks:results.length,failures,search});socket.close();if(failures.length)process.exitCode=1;
