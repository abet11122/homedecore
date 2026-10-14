import fs from 'node:fs';
import path from 'node:path';

// Read-only site audit. Writes reports only; never mutates pages or routing.
const base = 'https://www.cozynestideas.online';
const out = 'audits/adsense';
fs.mkdirSync(out, { recursive: true });
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d,e.name)) : [path.join(d,e.name)]);
const clean = s => s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,'').replace(/<[^>]+>/g,' ').replace(/&(?:[a-z]+|#\d+);/gi,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1');
const tokens = s => clean(s).match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu) ?? [];
const scalar = (s,k) => s.match(new RegExp(`^${k}:\\s*(.+)$`,'m'))?.[1]?.trim().replace(/^["']|["']$/g,'') ?? '';
const csv = (rows, cols) => [cols,...rows.map(r=>cols.map(c=>r[c]??''))].map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const writeCsv = (name,rows,cols) => fs.writeFileSync(`${out}/${name}`,csv(rows,cols));
const posts = walk('src/content/posts').filter(f=>f.endsWith('.md')).map(file=>{
  const source=fs.readFileSync(file,'utf8');
  const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if(!match) throw Error(`Cannot parse ${file}`);
  const [,fm,raw]=match;
  let body=raw.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, x=>x.replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi,''))
    .replace(/<div\b[^>]*class="[^"]*shop-look-wrap[^"]*"[^>]*>[\s\S]*?<\/div>/gi,'');
  body=body.replace(/^#{1,6}\s*(?:FAQ|Frequently asked|Related|Explore more|Read next)[^\n]*\n[\s\S]*?(?=^#{1,2}\s|$(?![\s\S]))/gim,'');
  const ideas=[...body.matchAll(/^#{2,4}\s+(?:\*\*)?\d+[.)]\s+.+$/gm)];
  const sections=ideas.map((m,i)=>body.slice(m.index+m[0].length,ideas[i+1]?.index??body.length));
  const bullets=[...body.matchAll(/^\s*(?:[-*+] |\d+[.)] )(.+)$/gm)];
  const slug=path.basename(file,'.md');
  const images=new Set([scalar(fm,'heroImage'),scalar(fm,'pinImage'),...[...raw.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)].map(m=>m[1]),...[...raw.matchAll(/<img\b[^>]*src=["']([^"']+)/g)].map(m=>m[1])].filter(Boolean));
  const documented=fs.readFileSync('IMAGE_SOURCES.md','utf8').includes(`| ${slug} |`) || fs.readFileSync('IMAGE_SOURCES.md','utf8').includes(`${slug} /`);
  const stock=[...images].filter(s=>/photo-|unsplash|pexels/i.test(s)|| (s.startsWith('/images/')&&documented)).length;
  return {file,slug,url:`${base}/post/${slug}/`,title:scalar(fm,'title'),category:scalar(fm,'category'),publish_date:scalar(fm,'publishDate'),body_word_count:tokens(body).length,list_item_count:ideas.length||bullets.length,average_words_per_list_item:ideas.length?(sections.reduce((n,s)=>n+tokens(s).length,0)/ideas.length).toFixed(1):bullets.length?(bullets.reduce((n,m)=>n+tokens(m[1]).length,0)/bullets.length).toFixed(1):'',original_image_count:0,stock_image_count:stock,unknown_image_count:images.size-stock,stock_only:stock===images.size?'YES':'UNVERIFIED',off_topic_flag:/costume|basket|pumpkin-carving|crafts-for-children/.test(slug)?'YES':'NO',near_duplicate_group:'',editorial_hold:/^editorialReady:\s*false/m.test(fm),body,tags:scalar(fm,'tags')};
});

// Proposed editorial consolidation, not a claim that related text is copied.
const groups = {
 'small-bedroom-layout-ideas':['bedroom-ideas-small-spaces-bigger','small-bedroom-makeover-ideas','small-bedroom-ideas-that-look-expensive','cozy-small-bedroom-ideas','aesthetic-bedroom-ideas-small-rooms','baddie-bedroom-ideas-small-rooms'],
 'small-bedroom-storage-ideas':['bedroom-storage-ideas-small-rooms','bookshelf-ideas-small-bedrooms'],
 'bedroom-sanctuary-layering':[],
 'neutral-bedroom-ideas':['warm-neutral-bedroom-ideas','beige-bedroom-ideas','cream-bedroom-ideas','earthy-bedroom-ideas'],
 'bedroom-lighting-layers':['cozy-bedroom-lighting-ideas'],
 'bedroom-wallpaper-ideas':['bedroom-accent-wall-ideas','bedroom-wall-decor-above-bed'],
 'bedroom-curtain-ideas':[], 'bedroom-rug-ideas':[], 'black-and-white-bedroom-ideas':[], 'beach-bedroom-ideas':[], 'attic-bedroom-ideas':[], 'small-bedroom-maximalist-guide':[],
 'boys-bedroom-ideas-cool-livable':['boys-bedroom-decor-ideas','boys-bedroom-looks-everyday-details','modern-boys-bedroom-ideas','bedroom-ideas-for-young-boys'],
 'boys-bedroom-paint-color-ideas':['blue-boys-bedroom-ideas','navy-boys-bedroom-ideas'],
 'boys-gaming-bedroom-ideas':['boys-gamer-bedroom-ideas'],
 'shared-boys-bedroom-ideas':['boys-bunk-bed-bedroom-ideas'],
 'teenage-boy-bedroom-ideas':['bedroom-ideas-small-teen-rooms'],
 'small-boys-bedroom-ideas':['boys-bedroom-storage-ideas'],
 'boho-girls-bedroom-ideas':['blue-girls-bedroom-ideas'],
 'living-room-layout-rules':['small-apartment-living-room-ideas'], 'minimalist-living-room-guide':[],
 'small-apartment-organization-ideas':['small-apartment-storage-ideas','renter-friendly-storage-ideas-no-drilling','apartment-decor-ideas-budget'],
 'studio-apartment-zoning':['small-studio-apartment-ideas'], 'small-home-office-ideas':[],
 'small-kitchen-organization-ideas':['small-kitchen-storage-ideas','kitchen-cabinet-organization-ideas','kitchen-drawer-organization-ideas','kitchen-corner-storage-ideas'],
 'small-pantry-organization-ideas':[], 'small-laundry-room-organization-ideas':[], 'kitchen-island-styling':['kitchen-countertop-decor-ideas','kitchen-open-shelving-styling'],
 'small-bathroom-organization-ideas':['bathroom-organization-ideas-small-spaces','bathroom-storage-ideas-small-spaces','bathroom-counter-organization-ideas','bathroom-over-toilet-storage-ideas','under-sink-bathroom-organization-ideas'],
 'small-bathroom-decor-ideas':['bathroom-vanity-decor-ideas','bathroom-shelf-styling-ideas'], 'bathroom-lighting-ideas':[], 'renter-friendly-bathroom-ideas':[],
 'small-entryway-ideas':['small-entryway-organization-ideas','entryway-storage-ideas','entryway-table-decor-ideas','mudroom-ideas-small-homes','narrow-hallway-decor-ideas'],
 'renter-friendly-wall-decor-ideas':[], 'paint-colour-guide':[], 'diy-floating-shelves':[], 'diy-ceramic-planters':[],
 'small-patio-ideas-apartments':['balcony-decor-ideas','backyard-seating-area-ideas'],
 'fall-living-room-decor-ideas':['fall-apartment-decor-ideas','autumn-mantel-styling'],
 'winter-hygge-guide':['cozy-winter-home-decor-ideas'],
 'small-space-christmas-decor-ideas':['apartment-christmas-door-decor-ideas','christmas-entryway-ideas','christmas-entryway-decor-ideas','christmas-kitchen-decor-ideas','christmas-coffee-table-decor-ideas'],
 'cozy-christmas-living-room-ideas':[], 'cozy-christmas-bedroom-ideas':['christmas-bedroom-ideas'], 'christmas-table-setting-ideas':[], 'green-christmas-decor-ideas':[],
 'small-apartment-halloween-decor-no-damage':['small-apartment-halloween-decor-ideas','small-space-halloween-decor','halloween-bedroom-decor-ideas','halloween-bathroom-decor-ideas','halloween-living-room-ideas','halloween-kitchen-decor-ideas'],
 'halloween-door-decor-ideas':['halloween-door-decorations','halloween-entryway-ideas','halloween-porch-decor-ideas'],
 'halloween-yard-ideas':['diy-halloween-decor-outdoor','funny-outdoor-halloween-decorations','backyard-halloween-party-ideas'],
 'elegant-halloween-decor':['gothic-halloween-decor-ideas','vintage-halloween-decor-ideas','pink-halloween-decor-ideas','halloween-centerpieces','halloween-fireplace-decor-ideas','y2k-apocalypse-halloween-party-decor-ideas','halloween-crafts-for-adults','pumpkin-painting-ideas']
};
const bySlug=new Map(posts.map(p=>[p.slug,p]));
for(const [target,members] of Object.entries(groups)) {
  if(!bySlug.has(target)) throw Error(`Missing keep target ${target}`);
  for(const slug of [target,...members]) {
    const p=bySlug.get(slug); if(!p) throw Error(`Missing member ${slug}`);
    if(p.action) throw Error(`Repeated triage ${slug}`);
    p.near_duplicate_group=members.length?`topic:${target}`:'';
    p.action=slug===target?'KEEP+IMPROVE':'MERGE'; p.merge_into=slug===target?'':bySlug.get(target).url;
    p.reason=slug===target?'Distinct retained intent; requires evidence and depth review.':'Overlapping reader intent; transfer only useful distinct material before 301.';
  }
}
for(const p of posts) if(!p.action) {p.action='REMOVE';p.reason=p.off_topic_flag==='YES'?'Outside home decor: costume, gift basket, or children activity.':'Unassigned topic: requires explicit editorial review before removal.';p.merge_into='';}

let live=[];
if(process.argv.includes('--live')) {
  const get=async url=>{const start=Date.now();try {const r=await fetch(url,{signal:AbortSignal.timeout(25000)});return {url,status:r.status,final_url:r.url,fetch_ms:Date.now()-start,html:await r.text()};}catch(e){return {url,status:'ERROR',error:e.message};}};
  const index=await get(`${base}/sitemap-index.xml`);
  const maps=[...index.html?.matchAll(/<loc>([^<]+)<\/loc>/g)??[]].map(m=>m[1]);
  const xml=await Promise.all(maps.map(get));
  const urls=new Set(xml.flatMap(r=>[...r.html?.matchAll(/<loc>([^<]+)<\/loc>/g)??[]].map(m=>m[1])));
  for(const p of posts) urls.add(p.url);
  for(const route of ['/robots.txt','/ads.txt','/sitemap.xml','/rss.xml','/about/','/contact/','/terms/','/tag/onthecorner/','/search/','/404/']) urls.add(base+route);
  const queue=[...urls];
  await Promise.all(Array.from({length:6},async()=>{while(queue.length){const r=await get(queue.shift());live.push(r);if(live.length%30===0) console.log(`Fetched ${live.length}/${urls.size}`);}}));
  fs.writeFileSync(`${out}/live-snapshot.json`,JSON.stringify({audited_at:new Date().toISOString(),sitemap_index:index,sitemaps:xml,pages:live},null,2));
} else if(fs.existsSync(`${out}/live-snapshot.json`)) live=JSON.parse(fs.readFileSync(`${out}/live-snapshot.json`)).pages;
const pageMap=new Map(live.map(p=>[p.url,p]));
function articleBody(html) {
  const start=html.indexOf('<div class="article">'); if(start<0)return '';
  const rest=html.slice(start);let depth=0;
  for(const m of rest.matchAll(/<\/?div\b[^>]*>/gi)){depth+=m[0].startsWith('</')?-1:1;if(depth===0)return rest.slice(0,m.index+m[0].length);}
  return '';
}
for(const p of posts){
  const l=pageMap.get(p.url);p.live_status=l?.status??'NOT CHECKED';p.live_title=l?.html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'';p.metrics_source='local Markdown';
  const body=articleBody(l?.html??'').replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi,'').replace(/<div\b[^>]*class="[^"]*shop-look-wrap[^"]*"[^>]*>[\s\S]*?<\/div>/gi,'');
  if(body){p.body_word_count=tokens(body).length;p.metrics_source='live article body';const ideas=[...body.matchAll(/<h[234]\b[^>]*>\s*\d+[.)][\s\S]*?<\/h[234]>/gi)];
    const list=[...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];p.list_item_count=ideas.length||list.length;
    p.average_words_per_list_item=ideas.length?(ideas.reduce((n,m,i)=>n+tokens(body.slice(m.index+m[0].length,ideas[i+1]?.index??body.length)).length,0)/ideas.length).toFixed(1):list.length?(list.reduce((n,m)=>n+tokens(m[1]).length,0)/list.length).toFixed(1):'';
  }
}
const pairs=[];
const shingles=p=>{const t=tokens(p.body).map(w=>w.toLowerCase());return new Set(t.slice(0,-4).map((_,k)=>t.slice(k,k+5).join(' ')));};
const phraseSets=new Map(posts.map(p=>[p.slug,shingles(p)]));
for(let i=0;i<posts.length;i++)for(let j=i+1;j<posts.length;j++){
  const a=posts[i],b=posts[j];
  const aa=phraseSets.get(a.slug),bb=phraseSets.get(b.slug);const shared=[...aa].filter(s=>bb.has(s)).length;
  const containment=shared/Math.max(1,Math.min(aa.size,bb.size));
  if(containment>=0.12) pairs.push({url_a:a.url,url_b:b.url,shared_five_word_phrases:shared,containment:containment.toFixed(3),review:'Similarity candidate; not proof of copying.'});
}
writeCsv('audit.csv',posts,['url','title','category','publish_date','body_word_count','list_item_count','average_words_per_list_item','original_image_count','stock_image_count','unknown_image_count','stock_only','off_topic_flag','near_duplicate_group','editorial_hold','live_status','live_title','metrics_source']);
fs.copyFileSync(`${out}/audit.csv`,'audit.csv');
writeCsv('triage.csv',posts,['url','title','action','merge_into','reason','off_topic_flag','stock_only']);
writeCsv('similarity.csv',pairs,['url_a','url_b','shared_five_word_phrases','containment','review']);
const findings=live.filter(r=>r.html&&/<html|<!doctype html/i.test(r.html)).map(r=>({url:r.url,status:r.status,h1_count:[...r.html.matchAll(/<h1\b/gi)].length,canonical:r.html.match(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']([^"']+)/i)?.[1]??'',noindex:/<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*noindex/i.test(r.html),images_missing_alt:[...r.html.matchAll(/<img\b[^>]*>/gi)].filter(m=>! /\s+alt(?:\s|=|>)/.test(m[0])).length,remote_image_count:[...r.html.matchAll(/<img\b[^>]*src=["']https?:/gi)].length,ad_loader:/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle/.test(r.html),fetch_ms:r.fetch_ms,elena_claim:/twelve years|12 years|Elena Marsh/i.test(r.html)}));
writeCsv('technical.csv',findings,['url','status','h1_count','canonical','noindex','images_missing_alt','remote_image_count','ad_loader','fetch_ms','elena_claim']);
const links=[];
for(const r of live.filter(r=>r.html&&r.status===200&&/<html/i.test(r.html)))for(const m of r.html.matchAll(/href=["']([^"'#]+)["']/gi)){
 try {const u=new URL(m[1],r.url);if(u.origin===base&&pageMap.has(u.href)&&pageMap.get(u.href).status!==200)links.push({from:r.url,to:u.href,status:pageMap.get(u.href).status});}catch{}
}
writeCsv('broken-known-links.csv',links,['from','to','status']);
writeCsv('keep-input-plan.csv',posts.filter(p=>p.action==='KEEP+IMPROVE').map((p,i)=>({url:p.url,structure:['Decision guide with tradeoffs','Annotated layout and constraints','Troubleshooting guide','Comparison of options','Project method with materials and checks','Before/after case study awaiting owner evidence'][i%6],photo:`[MY PHOTO: show the actual ${p.slug.replaceAll('-',' ')} setup and a close-up of one detail]`,measurements:'[MY MEASUREMENTS / COST / TIME]',experience:'[WHAT I TRIED AND WHAT WENT WRONG]',opinion:'[MY OPINION: which idea I would pick and why]',depth:'For each retained idea: suitability, constraints, steps, tradeoffs, evidence, and source for factual claims.',stock_only:p.stock_only})),['url','structure','photo','measurements','experience','opinion','depth','stock_only']);
const count=a=>posts.filter(p=>p.action===a).length;
const summary={posts:posts.length,keep:count('KEEP+IMPROVE'),merge:count('MERGE'),remove:count('REMOVE'),off_topic:posts.filter(p=>p.off_topic_flag==='YES').length,stock_only:posts.filter(p=>p.stock_only==='YES').length,unverified_images:posts.filter(p=>p.unknown_image_count).length,live_pages:live.length,similarity_candidates:pairs.length,thin_under_500:posts.filter(p=>p.body_word_count<500).length};
fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(summary);
