import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk('src').filter(f=>/\.(astro|ts|md)$/.test(f)&&!f.includes(`${path.sep}editorial${path.sep}`));
const active=files.filter(f=>!/^disposition:\s*merge\s*$/m.test(fs.readFileSync(f,'utf8')));
const refs=new Set();
for(const f of active){const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/photo-\d+-[a-z0-9]+/g))refs.add(m[0]);for(const m of s.matchAll(/https:\/\/images\.(?:pexels|unsplash)\.com\/[^\s"'<>`)]+/g))if(!m[0].includes('${'))refs.add(m[0].replaceAll('&amp;','&'));}
fs.mkdirSync('public/images/stock',{recursive:true});fs.mkdirSync('src/data',{recursive:true});
const manifestPath='src/data/stock-images.json';
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
const errors=[];const pending=[...refs];let completed=0;
await Promise.all(Array.from({length:4},async()=>{while(pending.length){const ref=pending.shift();try{
 if(manifest[ref]&&manifest[ref].variants.every(v=>fs.existsSync('public'+v.src))){completed++;continue;}
 const url=ref.startsWith('photo-')?`https://images.unsplash.com/${ref}?w=1600&auto=format&q=85`:ref;
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`HTTP ${r.status}`);
 const buffer=Buffer.from(await r.arrayBuffer());const metadata=await sharp(buffer).metadata();
 const id=createHash('sha256').update(ref).digest('hex').slice(0,16);
 const variants=[];for(const w of [360,720,1280,1600].filter(w=>w<=metadata.width)){
  const src=`/images/stock/${id}-${w}.webp`;const result=await sharp(buffer).rotate().resize({width:w,withoutEnlargement:true}).webp({quality:76}).toFile('public'+src);variants.push({src,width:result.width,height:result.height,bytes:result.size});
 }
 if(!variants.length){const src=`/images/stock/${id}-${metadata.width}.webp`;const result=await sharp(buffer).rotate().webp({quality:76}).toFile('public'+src);variants.push({src,width:result.width,height:result.height,bytes:result.size});}
 manifest[ref]={provider:/pexels/.test(ref)?'Pexels':'Unsplash',source_url:url,stock:true,downloaded_at:new Date().toISOString(),variants};
}catch(e){errors.push({ref,error:e.message});}finally{completed++;if(completed%20===0)console.log(`Processed ${completed}/${refs.size} image sources`);}}}));
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('audits/adsense/image-download-errors.json',JSON.stringify(errors,null,2)+'\n');
// Markdown image URLs do not pass through Img.astro: replace just their image src.
for(const f of active.filter(f=>f.endsWith('.md'))){let s=fs.readFileSync(f,'utf8');s=s.replace(/(!\[[^\]]*\]\()(https:\/\/images\.(?:pexels|unsplash)\.com\/[^\s)]+)(\))/g,(all,a,ref,b)=>manifest[ref]?a+manifest[ref].variants.at(-1).src+b:all);s=s.replace(/(<img\b[^>]*src=["'])(https:\/\/images\.(?:pexels|unsplash)\.com\/[^"']+)(["'])/g,(all,a,ref,b)=>manifest[ref]?a+manifest[ref].variants.at(-1).src+b:all);fs.writeFileSync(f,s);}
console.log({sources:refs.size,cached:Object.keys(manifest).length,errors});if(errors.length)process.exitCode=1;
