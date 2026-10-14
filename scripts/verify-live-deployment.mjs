import fs from 'node:fs';
import path from 'node:path';
const base='https://www.cozynestideas.online';
const parse=s=>s.trim().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replaceAll('""','"')));
const [cols,...rows]=parse(fs.readFileSync('audits/adsense/triage.csv','utf8'));
const posts=rows.map(row=>Object.fromEntries(cols.map((c,i)=>[c,row[i]])));
const get=async url=>{try{const r=await fetch(url,{redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});return {url,status:r.status,location:r.headers.get('location'),html:await r.text()};}catch(e){return {url,status:'ERROR',error:e.message};}};
if(process.argv.includes('--probe')){
 const home=await get(base+'/');const terms=await get(base+'/terms/');const redirect=await get(base+'/post/halloween-door-decorations/');
 const result={homepageStatus:home.status,editorialByline:home.html?.includes('Editorial Team')??false,adsLoaded:/pagead2\.googlesyndication/.test(home.html??''),termsUpdated:terms.html?.includes('October 14, 2026')??false,mergeStatus:redirect.status,mergeDestination:redirect.location};
 console.log(result);process.exit(result.editorialByline&&result.termsUpdated&&result.mergeStatus===301?0:1);
}
const queue=[...posts.map(p=>p.url),...['/','/about/','/terms/','/contact/','/search/','/tags/','/author/editorial-team/','/author/elena-marsh/','/tag/onthecorner/','/category/diy-decor/','/robots.txt','/ads.txt','/rss.xml','/sitemap-index.xml','/sitemap-0.xml'].map(p=>base+p)];
const responses=[];await Promise.all(Array.from({length:6},async()=>{while(queue.length){responses.push(await get(queue.shift()));if(responses.length%40===0)console.log(`Checked ${responses.length} live routes`);}}));
const map=new Map(responses.map(r=>[r.url,r]));const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message);};
const sitemap=map.get(base+'/sitemap-0.xml')?.html??'';const rss=map.get(base+'/rss.xml')?.html??'';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=new Map(walk('src/content/posts').filter(f=>f.endsWith('.md')).map(f=>[path.basename(f,'.md'),f]));
for(const p of posts){const r=map.get(p.url);const urlPath=new URL(p.url).pathname;
 if(p.action==='MERGE'){
  check(r.status===301,`${p.url}: expected 301, got ${r.status}`);
  check(r.location&&new URL(r.location,base).href===p.merge_into,`${p.url}: incorrect redirect ${r.location}`);
  check(!sitemap.includes(p.url)&&!rss.includes(p.url),`${p.url}: retired URL remains in feed or sitemap`);
 }else{
  check(r.status===200,`${p.url}: expected 200, got ${r.status}`);
  check(!/adsbygoogle|pagead2\.googlesyndication/.test(r.html??''),`${p.url}: ad code remains`);
  check(!/Elena Marsh|twelve years|#person/.test(r.html??''),`${p.url}: old identity remains`);
  const slug=urlPath.split('/').filter(Boolean).at(-1);const s=fs.readFileSync(files.get(slug),'utf8');
  const date=s.match(/^publishDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];const excluded=p.action==='REMOVE'||/^editorialReady:\s*false/m.test(s)||new Date(date+'T00:00:00Z')>new Date();
  const noindex=/<meta\b(?=[^>]*name="robots")[^>]*content="[^"]*noindex/i.test(r.html??'');
  check(noindex===excluded,`${p.url}: unexpected indexing state`);
  check(sitemap.includes(p.url)===!excluded,`${p.url}: unexpected sitemap membership`);
  check(rss.includes(p.url)===!excluded,`${p.url}: unexpected RSS membership`);
  const canonical=r.html?.match(/<link\b(?=[^>]*rel="canonical")[^>]*href="([^"]+)"/)?.[1];check(canonical===p.url,`${p.url}: canonical is ${canonical}`);
  const images=[...r.html?.matchAll(/<img\b[^>]*src="([^"]+)"/g)??[]];check(images.every(m=>m[1].startsWith('/')),`${p.url}: remote image source remains`);
 }
}
for(const route of ['/author/elena-marsh/','/tag/onthecorner/','/category/diy-decor/'])check(map.get(base+route)?.status===301,`${route}: expected retirement 301`);
for(const route of ['/','/about/','/terms/','/contact/','/search/','/tags/','/author/editorial-team/','/robots.txt','/ads.txt','/rss.xml','/sitemap-index.xml','/sitemap-0.xml'])check(map.get(base+route)?.status===200,`${route}: expected 200`);
const home=map.get(base+'/')?.html??'';check(home.includes('href="/terms/"'),'Home footer missing terms');
const image=home.match(/<img\b[^>]*src="([^"]+)"/)?.[1];if(image){const r=await get(new URL(image,base).href);check(r.status===200,`Sample self-hosted image returned ${r.status}`);}
const report={checked_at:new Date().toISOString(),domain:base,postRoutes:posts.length,mergeRedirects:posts.filter(p=>p.action==='MERGE').length,utilityRoutes:15,failures,responses:responses.map(({html,...r})=>r)};
fs.writeFileSync('audits/adsense/live-deployment-validation.json',JSON.stringify(report,null,2)+'\n');console.log({postRoutes:posts.length,failures});if(failures.length)process.exitCode=1;
