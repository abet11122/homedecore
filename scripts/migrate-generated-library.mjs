// One-time mechanical migration. Original files are archived outside the public tree.
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const archive = path.join(root, 'audits/generated-migration/source-backup');
const manifest = JSON.parse(fs.readFileSync('src/data/generated-library.json', 'utf8'));
const categories = { 'living-room': 'living-room-rug', bedroom: 'bedroom', kitchen: 'kitchen', bathroom: 'bathroom', entryway: 'rental-entryway', 'small-spaces': 'small-spaces', 'home-office': 'home-office', 'diy-decor': 'diy-decor', outdoor: 'outdoor', seasonal: 'autumn', renter: 'rental-entryway' };
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const save = (file, source) => { const backup = path.join(archive, path.relative(root, path.resolve(file))); fs.mkdirSync(path.dirname(backup), {recursive:true}); if (!fs.existsSync(backup)) fs.copyFileSync(file, backup); fs.writeFileSync(file, source); };
const log = [];
for (const file of walk('src/content/posts').filter(f => f.endsWith('.md'))) {
  let source = fs.readFileSync(file, 'utf8');
  const slug = path.basename(file, '.md');
  const category = source.match(/^category:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  let name = categories[category];
  if (!name) throw Error(`Missing category mapping: ${file}`);
  if (/christmas/.test(slug)) name = /table/.test(slug) ? 'christmas-table' : 'christmas';
  else if (/halloween|pumpkin|costume|boo-basket|spooky-basket/.test(slug)) name = 'halloween';
  else if (/fall-/.test(slug)) name = 'autumn';
  else if (/boys|girls|teen|gaming/.test(slug)) name = 'kids-bedroom';
  else if (/curtain/.test(slug)) name = 'bedroom-curtains';
  const src = `/images/generated/${name}-1536.webp`;
  source = source.replace(/^heroImage:.*$/m, `heroImage: "${src}"`).replace(/^pinImage:.*$/m, `pinImage: "${src}"`);
  if (/^heroImageAlt:/m.test(source)) source = source.replace(/^heroImageAlt:.*$/m, `heroImageAlt: "${manifest[name]}"`);
  else source = source.replace(/^heroImage:.*$/m, `$&\nheroImageAlt: "${manifest[name]}"`);
  const figures = [...source.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)].length;
  const markdown = [...source.matchAll(/!\[[^\]]*\]\([^\n]+\)/g)].length;
  // Remove old photo-dependent galleries instead of repeating one generated image per idea.
  source = source.replace(/<figure\b[\s\S]*?<\/figure>/gi, '').replace(/!\[[^\]]*\]\([^\n]+\)/g, '').replace(/^\*Photo:.*\*\s*$/gm, '');
  source = source.replace(/<img\b[^>]*>/gi, '').replace(/\n{4,}/g, '\n\n\n');
  if (/images\/(?:stock|posts)|images\.(?:unsplash|pexels)|photo-\d/.test(source)) throw Error(`Unconverted image in ${file}`);
  save(file, source);
  log.push({file, generatedImage:name, removedPhotoFigures:figures, removedMarkdownImages:markdown});
}
let site = fs.readFileSync('src/site.ts','utf8');
for (const [category,name] of Object.entries(categories)) {
  const re = new RegExp(`(slug: '${category}',[\\s\\S]*?image: )'[^']+'`);
  site = site.replace(re, `$1'/images/generated/${name}-1536.webp'`);
}
site = site.replace('stock photographs do not document projects completed by us.', 'AI-generated illustrations are visual concepts, not photographs of projects completed by us.');
save('src/site.ts',site);
let layout = fs.readFileSync('src/layouts/Layout.astro','utf8').replace(/const DEFAULT_PHOTO = '[^']+';/, "const DEFAULT_PHOTO = '/images/generated/living-room-rug-1536.webp';");
save('src/layouts/Layout.astro',layout);
fs.mkdirSync('audits/generated-migration',{recursive:true});
fs.writeFileSync('audits/generated-migration/changes.json',JSON.stringify(log,null,2)+'\n');
console.log({articles:log.length, removedPhotoFigures:log.reduce((a,b)=>a+b.removedPhotoFigures,0), removedMarkdownImages:log.reduce((a,b)=>a+b.removedMarkdownImages,0)});
