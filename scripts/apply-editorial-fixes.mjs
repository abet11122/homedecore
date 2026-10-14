import fs from 'node:fs';
import path from 'node:path';

if (fs.existsSync('audits/adsense/consolidation-log.json')) {
  throw new Error('This one-time migration has already been applied. Do not rerun it over subsequent editorial corrections.');
}

const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const parseCsv=s=>s.trim().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replaceAll('""','"')));
const [headers,...values]=parseCsv(fs.readFileSync('audits/adsense/triage.csv','utf8'));
const decisions=values.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]])));
const files=new Map(walk('src/content/posts').filter(f=>f.endsWith('.md')).map(f=>[path.basename(f,'.md'),f]));
const slug=url=>new URL(url).pathname.split('/').filter(Boolean).at(-1);
const original=new Map([...files].map(([s,f])=>[s,fs.readFileSync(fs.existsSync(`audits/adsense/pre-remediation/${s}.md`)?`audits/adsense/pre-remediation/${s}.md`:f,'utf8')]));
const approved=new Map(decisions.map(d=>[slug(d.url),d]));
const setField=(s,k,v)=>new RegExp(`^${k}:.*$`,'m').test(s)?s.replace(new RegExp(`^${k}:.*$`,'m'),`${k}: ${v}`):s.replace(/^---\r?\n/,`---\n${k}: ${v}\n`);
const normalize=s=>s.toLowerCase().replace(/\d+[.)]|[^a-z\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!['the','for','and','with','your','ideas','use','add','choose'].includes(w));
const sections=s=>[...s.matchAll(/^#{2,3}\s+(.+)\r?$/gm)].map((m,i,a)=>({title:m[1].replace(/^\d+[.)]\s*/,''),text:s.slice(m.index+m[0].length,a[i+1]?.index??s.length).trim()}));
const overlaps=(a,b)=>{const aa=new Set(normalize(a)),bb=new Set(normalize(b));return [...aa].filter(w=>bb.has(w)).length/Math.max(1,Math.min(aa.size,bb.size));};
const log=[];
fs.mkdirSync('src/editorial/posts',{recursive:true});
fs.mkdirSync('audits/adsense/pre-remediation',{recursive:true});
for(const [s,text] of original) {
  const backup=`audits/adsense/pre-remediation/${s}.md`;
  if(!fs.existsSync(backup))fs.writeFileSync(backup,text);
}

for(const d of decisions){
 const s=slug(d.url),file=files.get(s);if(!file)throw Error(`Missing post ${s}`);
 let text=original.get(s);
 text=setField(text,'disposition',d.action==='KEEP+IMPROVE'?'keep':d.action.toLowerCase());
 if(d.action==='MERGE')text=setField(text,'mergeInto',JSON.stringify(new URL(d.merge_into).pathname));
 text=text.replace(/"onthecorner"\s*,?\s*|,?\s*"onthecorner"/g,'').replace(/\[\s*,/g,'[');
 if(d.action==='KEEP+IMPROVE'){
  const targetHeadings=sections(text).map(x=>x.title);
  const appended=[];
  for(const source of decisions.filter(x=>x.action==='MERGE'&&x.merge_into===d.url)){
   const sourceSlug=slug(source.url);
   const candidates=sections(original.get(sourceSlug)).filter(x=>! /faq|frequently|final|conclusion|bottom line|wrapping|related|cost|budget|materials|time|shop|takeaway/i.test(x.title)&&x.text.split(/\s+/).length>=35&&x.text.split(/\s+/).length<=350&&! /\bI (?:tried|tested|made|bought)|\bmy (?:home|room|project)/i.test(x.text));
   const picked=candidates.find(x=>targetHeadings.every(h=>overlaps(h,x.title)<0.55));
   if(picked){
    targetHeadings.push(picked.title);
    appended.push(`\n\n<!-- Consolidated existing section from ${sourceSlug}; see editorial worksheet for evidence checks. -->\n\n## ${picked.title}\n\n${picked.text}`);
    log.push({source:sourceSlug,target:s,section:picked.title,status:'existing section retained'});
   }else log.push({source:sourceSlug,target:s,section:'',status:'no sufficiently distinct bounded section; original retained in backup'});
  }
  // Stable marker makes subsequent runs safe; do not append the same material twice.
  if(!text.includes('<!-- Approved consolidation -->')&&appended.length){
   text+='\n\n<!-- Approved consolidation -->'+appended.join('')+'\n';
   // Numbered titles promise a fixed list size: additions make that count inaccurate.
   text=text.replace(/^(title:\s*["']?)\d+\s+/m,'$1');
   text=setField(text,'updatedDate','2026-10-14');
  }
  const structure=['Decision guide: compare options and constraints','Room layout: annotate placement and clearance','Troubleshooting guide: problem, fix, limitations','Options comparison: suitability and tradeoffs','Project method: materials, steps, evidence','Case study: before/after only after owner supplies evidence'][decisions.filter(x=>x.action==='KEEP+IMPROVE').indexOf(d)%6];
  const worksheet=`# ${d.title}\n\nURL: ${d.url}\n\nSuggested structure: ${structure}. Reorganize existing sections around the reader's decision; do not generate a replacement article.\n\n[MY PHOTO: show the actual ${s.replaceAll('-',' ')} setup, one detail, and before/after only if you made the change]\n\n[MY MEASUREMENTS / COST / TIME]\n\n[WHAT I TRIED AND WHAT WENT WRONG]\n\n[MY OPINION: which idea I would pick and why]\n\nImage status at audit: ${d.stock_only}. Self-hosted stock is still stock. No owner-original image is verified.\n\nFor each retained idea, add your real constraints, material/placement steps, why it fits, tradeoffs, what failed, and a source for factual dimensions, safety or product claims. Remove unsupported guaranteed results and cost/time claims. Do not invent measurements or describe a stock room as yours.\n\nMerged source material to check:\n${log.filter(x=>x.target===s).map(x=>`- ${x.source}: ${x.section||'review archived original'} (${x.status})`).join('\n')||'- No merged source posts.'}\n\nPublish personal experience only after filling these notes with evidence. These placeholders must remain outside published pages.\n`;
  if(!fs.existsSync(`src/editorial/posts/${s}.md`))fs.writeFileSync(`src/editorial/posts/${s}.md`,worksheet);
 }
 fs.writeFileSync(file,text);
}

// Resolve body links to merged destinations. Remove links to retired off-topic routes.
let linkChanges=0;
for(const file of files.values()){
 let text=fs.readFileSync(file,'utf8');
 const fix=url=>{const match=url.match(/^(?:https:\/\/www\.cozynestideas\.online)?\/post\/(?:new_blogs\/)?([^/#?]+)\/?(.*)$/);if(!match)return url;const d=approved.get(match[1]);if(d?.action==='MERGE'){linkChanges++;return new URL(d.merge_into).pathname+match[2];}return url;};
 text=text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(all,label,url)=>{const d=approved.get(url.match(/\/post\/([^/#?]+)\/?/)?.[1]);if(d?.action==='REMOVE'){linkChanges++;return label;}return `[${label}](${fix(url)})`;});
 text=text.replace(/href="([^"]+)"/g,(all,url)=>`href="${fix(url)}"`);
 // Proximate, visible disclosure for every existing shopping card.
 text=text.replace(/(<div class="shop-look-wrap">)(?!\s*<p class="affiliate-note")/g,'$1\n  <p class="affiliate-note text-sm text-ink-60">Affiliate link: we may earn a commission if you buy, at no extra cost to you.</p>');
 if(/amzn\.to|amazon\.[^/]+\/.*(?:tag=)|rel="[^"]*sponsored/.test(text))text=setField(text,'affiliateDisclosure','true');
 fs.writeFileSync(file,text);
}
const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const redirects=decisions.filter(d=>d.action==='MERGE').flatMap(d=>[
 {source:new URL(d.url).pathname,destination:new URL(d.merge_into).pathname,statusCode:301},
 {source:`/post/new_blogs/${slug(d.url)}/`,destination:new URL(d.merge_into).pathname,statusCode:301}
]);
redirects.push({source:'/author/elena-marsh/',destination:'/author/editorial-team/',statusCode:301},{source:'/tag/onthecorner/',destination:'/tags/',statusCode:301});
const sources=new Set(redirects.map(r=>r.source));
config.redirects=[...redirects,...config.redirects.filter(r=>!sources.has(r.source))];
fs.writeFileSync('vercel.json',JSON.stringify(config,null,2)+'\n');
fs.writeFileSync('audits/adsense/consolidation-log.json',JSON.stringify({linkChanges,sections:log},null,2)+'\n');

fs.writeFileSync('src/pages/about.astro',`---
import PageLayout from '../layouts/PageLayout.astro';
import { SITE } from '../site';
---
<PageLayout title="About Cozy Nest Ideas" eyebrow="About" description="What Cozy Nest Ideas publishes, what its editorial byline means, and how illustrative stock photography is used." lede="Home decorating inspiration, with a clear distinction between ideas and documented experience.">
  <h2>What this site publishes</h2>
  <p>{SITE.name} publishes room layouts, storage suggestions, decorating ideas and DIY guides. These articles offer general inspiration. They should not be read as proof that the publisher has built, bought or tested everything described.</p>
  <h2>Our editorial byline</h2>
  <p>Editorial Team is the publication byline. It does not identify a credentialed interior designer or imply a particular number of staff. We have removed an unsupported personal biography and a stock portrait previously used in the author profile.</p>
  <h2>How to read the guides</h2>
  <p>Articles bring together decorating suggestions and explain ways they might fit a home. Where a guide links to an outside source, readers can follow that link to check the source. A suggestion, dimension or product reference is not a report of our own measurements or tests unless the article provides that evidence explicitly.</p>
  <p>Costs and completion times vary by location, materials and experience. Check current prices and manufacturer instructions. Room dimensions, fixing methods, electrical work and fireplace clearances need checks appropriate to the actual home and product.</p>
  <h2>Photographs</h2>
  <p>Many images are licensed stock photographs from Unsplash and Pexels, including images stored on this site's own domain. They illustrate a style or decorating idea; they are not photographs of projects carried out by the publisher. Image credits identify sources where available. Stock photos should not be interpreted as product reviews or before-and-after evidence.</p>
  <h2>Commercial links</h2>
  <p>Some articles contain affiliate links. A purchase through an affiliate link may earn the site a commission. Read the <a href="/disclosure/">disclosure policy</a>. Advertising is disabled during this review.</p>
  <h2>Corrections and enquiries</h2>
  <p>For a correction, image-rights enquiry or question about the publication, use the address on our <a href="/contact/">contact page</a>. Include the article URL and the specific issue so it can be identified.</p>
</PageLayout>
`);
fs.writeFileSync('src/pages/disclosure.astro',`---
import PageLayout from '../layouts/PageLayout.astro';
import { SITE } from '../site';
---
<PageLayout title="Disclosure" eyebrow="Legal" description={\`Affiliate links, illustrative photography and the current advertising status of \${SITE.name}.\`} lede="Commercial relationships and image use, stated plainly." updated="October 14, 2026">
  <h2>Affiliate links</h2>
  <p>Some product links are affiliate links. If you buy through one, this site may earn a commission at no extra cost to you. Disclosures appear beside shopping links and above article bodies that contain affiliate links.</p>
  <p>Retailer prices, availability and delivery terms can change. Check the retailer's page before purchasing. A shopping link does not establish that the publisher has owned or tested the product.</p>
  <h2>Advertising</h2>
  <p>Advertising is disabled during the site's editorial review. No advertising approval or endorsement by Google is claimed.</p>
  <h2>Evidence and recommendations</h2>
  <p>Decorating suggestions are general inspiration. Personal testing, actual costs, project times and first-hand opinions require evidence specific to the article. Do not infer such experience from a stock photograph or a product link.</p>
  <h2>Sponsored material</h2>
  <p>A paid placement or gifted product, if included in an article, must be disclosed beside that material. An affiliate link alone is not evidence of sponsorship or a gifted item.</p>
  <h2>Photography</h2>
  <p>Illustrative photography includes stock images from <a href="https://unsplash.com/license" rel="noopener noreferrer" target="_blank">Unsplash</a> and <a href="https://www.pexels.com/license/" rel="noopener noreferrer" target="_blank">Pexels</a>. Self-hosted stock derivatives remain stock photographs. They do not document projects completed by this publication. Article credits identify sources where available.</p>
  <h2>Questions</h2>
  <p>Contact us through the <a href="/contact/">contact page</a> about a commercial link, correction or image-rights concern.</p>
</PageLayout>
`);
fs.writeFileSync('src/components/AdSlot.astro','---\n// Advertising is disabled during editorial review. This component intentionally renders nothing.\n---\n');
console.log({decisions:decisions.length,redirects:redirects.length,retainedSections:log.filter(x=>x.section).length,linkChanges});
