// One-time, evidence-scoped recovery. Does not reverse unrelated editorial decisions.
import fs from 'node:fs';
const slugs = ['kid-friendly-pumpkin-carving-ideas','funny-outdoor-halloween-decorations','trio-halloween-costume-ideas','pumpkin-painting-ideas','funny-couple-costume-ideas','halloween-costume-ideas-for-guys','halloween-costume-ideas-for-women','christmas-coffee-table-decor-ideas','brunette-halloween-costume-ideas','funny-halloween-costume-ideas','funny-halloween-costumes-for-families'];
const evidence = 'audits/seo-design/recovered-search-pages.json';
if (fs.existsSync(evidence)) throw Error('Recovery already applied; edit articles directly.');
for (const slug of slugs) {
  const file = `src/content/posts/new_blogs/${slug}.md`;
  let s = fs.readFileSync(file, 'utf8').replaceAll('\r\n','\n');
  s = s.replace(/^disposition:.*$/m,'disposition: keep').replace(/^mergeInto:.*\n/m,'').replace(/^editorialReady:.*\n/m,'');
  // Keep existing published dates; explicitly release the reviewed Christmas guide today.
  if (slug === 'christmas-coffee-table-decor-ideas') s = s.replace(/^publishDate:.*$/m,'publishDate: 2026-10-16');
  s = s.replace(/^updatedDate:.*\n/m,'').replace(/^---\n/,'---\nupdatedDate: 2026-10-16\n');
  fs.writeFileSync(file,s);
  const note = `src/editorial/posts/${slug}.md`;
  if (!fs.existsSync(note)) fs.writeFileSync(note,`# ${slug}\n\nRestored after owner-supplied Search Console evidence on October 16, 2026. Search demand is not proof of originality or AdSense approval.\n\n[MY PHOTO: supply an original image; current imagery is illustrative stock]\n\n[MY MEASUREMENTS / COST / TIME]\n\n[WHAT I TRIED AND WHAT WENT WRONG]\n\n[MY OPINION: provide genuine experience, not invented testing]\n`);
}
const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
config.redirects = config.redirects.filter(r => !slugs.some(s => r.source === `/post/${s}/` || r.source === `/post/new_blogs/${s}/`));
// The existing legacy-prefix rule now takes each restored URL to its own article.
fs.writeFileSync('vercel.json',JSON.stringify(config,null,2)+'\n');
fs.writeFileSync(evidence,JSON.stringify({date:'2026-10-16',source:'Owner-provided Search Console Pages table; date range unconfirmed',clicks:21,slugs},null,2)+'\n');
