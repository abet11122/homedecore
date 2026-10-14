import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('src/content/posts').filter(f=>f.endsWith('.md'));
const posts=files.map(file=>{const s=fs.readFileSync(file,'utf8');return {slug:path.basename(file,'.md'),source:s,disposition:s.match(/^disposition:\s*(\w+)/m)?.[1],target:s.match(/^mergeInto:\s*"([^"]+)"/m)?.[1],held:/^editorialReady:\s*false/m.test(s)};});
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const redirects=new Map(config.redirects.map(r=>[r.source,r]));
const htmlFiles=walk('dist').filter(f=>f.endsWith('.html'));
const sitemap=walk('dist').filter(f=>/sitemap.*\.xml$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('');
const rss=fs.readFileSync('dist/rss.xml','utf8');
const failures=[];
const check=(name,fn)=>{try{fn();}catch(e){failures.push(`${name}: ${e.message}`);}};
const htmlPath=slug=>path.join('dist','post',slug,'index.html');
const retained=new Set(posts.filter(p=>p.disposition==='keep').map(p=>`/post/${p.slug}/`));
for(const p of posts){const url=`/post/${p.slug}/`;
 if(p.disposition==='merge'){
  check(`301 ${url}`,()=>{assert.equal(redirects.get(url)?.statusCode,301);assert.equal(redirects.get(url)?.destination,p.target);assert(retained.has(p.target));assert(!redirects.has(p.target));assert(!fs.existsSync(htmlPath(p.slug)));assert(!sitemap.includes(url));assert(!rss.includes(url));});
 }else{
  check(`route ${url}`,()=>assert(fs.existsSync(htmlPath(p.slug))));
  if(p.disposition==='remove'||p.held)check(`noindex ${url}`,()=>{const h=fs.readFileSync(htmlPath(p.slug),'utf8');assert(/<meta name="robots" content="noindex, follow"/.test(h));assert(!sitemap.includes(url));assert(!rss.includes(url));});
  if(p.disposition==='keep')check(`worksheet ${p.slug}`,()=>{const note=fs.readFileSync(`src/editorial/posts/${p.slug}.md`,'utf8');for(const prompt of ['[MY PHOTO:','[MY MEASUREMENTS / COST / TIME]','[WHAT I TRIED AND WHAT WENT WRONG]','[MY OPINION:'])assert(note.includes(prompt));});
 }
}
let images=0,affiliateLinks=0;
const nonPublished=new Set(posts.filter(p=>p.disposition!=='keep'||p.held).map(p=>`/post/${p.slug}/`));
for(const file of htmlFiles){const h=fs.readFileSync(file,'utf8');
 check(`content ${file}`,()=>{assert(!/adsbygoogle|pagead2\.googlesyndication/.test(h));assert(!/Elena Marsh|twelve years|#person/.test(h));assert(!/\[MY PHOTO:|\[MY MEASUREMENTS|\[WHAT I TRIED|\[MY OPINION:/.test(h));assert(!/Nothing here yet\.|Coming soon/i.test(h));assert(h.includes('href="/terms/"'));});
 for(const m of h.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)){
  images++;check(`image ${file} ${m[1]}`,()=>{assert(m[1].startsWith('/'));assert(fs.existsSync(path.join('public',m[1])));assert(/\balt(?:=|\s|>)/.test(m[0]));});
 }
 for(const m of h.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)){
  const u=m[1];if(u.startsWith('/post/'))check(`link ${file} ${u}`,()=>{assert(!redirects.has(u),'body/navigation link uses redirect');assert(!nonPublished.has(u),'body/navigation promotes excluded article');});
  if(/amzn\.to|amazon\.[^/]+\/.*(?:tag=)/.test(u)){affiliateLinks++;check(`disclosure ${file}`,()=>{assert(/sponsored/.test(m[0]));assert(/Affiliate link:/.test(h.slice(Math.max(0,m.index-1600),m.index)),'missing proximate disclosure');});}
 }
}
const report={sourcePosts:posts.length,keep:posts.filter(p=>p.disposition==='keep').length,merge:posts.filter(p=>p.disposition==='merge').length,remove:posts.filter(p=>p.disposition==='remove').length,heldKeep:posts.filter(p=>p.disposition==='keep'&&p.held).length,htmlPages:htmlFiles.length,renderedImages:images,affiliateLinks,failures};
fs.writeFileSync('audits/adsense/remediation-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(report);if(failures.length)process.exitCode=1;
