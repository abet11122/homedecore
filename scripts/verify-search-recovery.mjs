import fs from 'node:fs';
import assert from 'node:assert/strict';
const { slugs } = JSON.parse(fs.readFileSync('audits/seo-design/recovered-search-pages.json'));
const { redirects } = JSON.parse(fs.readFileSync('vercel.json'));
const sitemap = fs.readFileSync('dist/sitemap-0.xml','utf8');
const feed = fs.readFileSync('dist/rss.xml','utf8');
const legacy = redirects.find(r => r.source === '/post/new_blogs/:slug/');
assert.equal(legacy?.destination, '/post/:slug/');
assert(legacy.permanent || [301,308].includes(legacy.statusCode));
for (const slug of slugs) {
  const route = `/post/${slug}/`;
  const url = `https://www.cozynestideas.online${route}`;
  assert(!redirects.some(r => r.source === route || r.source === `/post/new_blogs/${slug}/`), `${slug}: conflicting redirect`);
  const html = fs.readFileSync(`dist${route}index.html`,'utf8');
  assert(!/<meta\b[^>]*content="[^"]*noindex/.test(html), `${slug}: noindex`);
  assert(html.includes(`<link rel="canonical" href="${url}"`), `${slug}: canonical`);
  assert(sitemap.includes(`<loc>${url}</loc>`), `${slug}: missing from sitemap`);
  assert(feed.includes(`<link>${url}</link>`), `${slug}: missing from RSS`);
  assert(!feed.includes(`/post/new_blogs/${slug}/`), `${slug}: legacy feed link`);
}
console.log(`Search recovery: ${slugs.length} articles have indexable HTML, self-canonicals, sitemap entries and unambiguous legacy redirects.`);
