import fs from 'node:fs';
import path from 'node:path';

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  );

const markdown = walk('src/content/posts').filter((file) => file.endsWith('.md'));
const expectedPosts = new Set(
  markdown.map((file) =>
    `https://www.cozynestideas.online/post/${path
      .relative('src/content/posts', file)
      .replaceAll('\\', '/')
      .replace(/\.md$/, '')}/`
  )
);

const sitemapXml = walk('dist')
  .filter((file) => /sitemap-.*\.xml$/.test(file))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
const sitemapPosts = new Set(
  [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((url) => url.includes('/post/'))
);

const missingFromSitemap = [...expectedPosts].filter((url) => !sitemapPosts.has(url));
const extraPostUrls = [...sitemapPosts].filter((url) => !expectedPosts.has(url));

const htmlFiles = walk('dist').filter((file) => file.endsWith('.html'));
let missingTitles = 0;
let missingDescriptions = 0;
let missingCanonicals = 0;
const badCanonicals = [];
const brokenLinks = new Set();

function localUrlExists(url) {
  const pathname = url.split(/[?#]/)[0];
  if (!pathname.startsWith('/')) return true;
  if (pathname === '/') return fs.existsSync('dist/index.html');
  const target = path.join('dist', ...pathname.split('/').filter(Boolean));
  return (
    fs.existsSync(target) ||
    fs.existsSync(`${target}.html`) ||
    fs.existsSync(path.join(target, 'index.html'))
  );
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) missingTitles += 1;
  if (!/<meta name="description" content="[^"]+"/.test(html)) missingDescriptions += 1;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) missingCanonicals += 1;
  else if (!canonical[1].startsWith('https://www.cozynestideas.online/')) {
    badCanonicals.push(`${file}: ${canonical[1]}`);
  }
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const url = match[1];
    if (url.startsWith('/') && !localUrlExists(url)) brokenLinks.add(`${file} -> ${url}`);
  }
}

const missingImages = [];
for (const file of markdown) {
  const source = fs.readFileSync(file, 'utf8');
  const imagePattern = /(?:heroImage|pinImage):\s*["']?(\/images\/[^"'\r\n]+)|\]\((\/images\/[^) ]+)\)/g;
  for (const match of source.matchAll(imagePattern)) {
    const url = match[1] || match[2];
    if (!fs.existsSync(path.join('public', ...url.split('/').filter(Boolean)))) {
      missingImages.push(`${file}: ${url}`);
    }
  }
}

const report = {
  sourcePosts: expectedPosts.size,
  sitemapPosts: sitemapPosts.size,
  missingFromSitemap,
  extraPostUrls,
  htmlPages: htmlFiles.length,
  missingTitles,
  missingDescriptions,
  missingCanonicals,
  badCanonicals,
  brokenInternalLinks: [...brokenLinks],
  missingLocalImages: missingImages,
};

console.log(JSON.stringify(report, null, 2));
if (
  missingFromSitemap.length ||
  extraPostUrls.length ||
  missingTitles ||
  missingDescriptions ||
  missingCanonicals ||
  badCanonicals.length ||
  brokenLinks.size ||
  missingImages.length
) {
  process.exitCode = 1;
}
