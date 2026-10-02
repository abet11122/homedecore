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
const metadata = {
  titles: new Map(),
  descriptions: new Map(),
  canonicals: new Map(),
};
const badH1Pages = [];
const invalidJsonLd = [];
const imagesWithoutAlt = new Set();
const futureDatedPages = new Set();

function record(map, value, file) {
  if (!value) return;
  const files = map.get(value) ?? [];
  files.push(file);
  map.set(value, files);
}

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
  const title = html.match(/<title>([^<]+)<\/title>/);
  const description = html.match(/<meta name="description" content="([^"]+)"/);
  if (!title) missingTitles += 1;
  else record(metadata.titles, title[1], file);
  if (!description) missingDescriptions += 1;
  else record(metadata.descriptions, description[1], file);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) missingCanonicals += 1;
  else {
    record(metadata.canonicals, canonical[1], file);
    if (!canonical[1].startsWith('https://www.cozynestideas.online/')) {
      badCanonicals.push(`${file}: ${canonical[1]}`);
    }
  }
  const h1Count = [...html.matchAll(/<h1(?:\s|>)/g)].length;
  if (h1Count !== 1 && !file.endsWith(`${path.sep}404.html`)) badH1Pages.push(`${file}: ${h1Count}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      invalidJsonLd.push(`${file}: ${error.message}`);
    }
  }
  for (const match of html.matchAll(/<img\s[\s\S]*?>/g)) {
    // Astro serializes alt="" as the valid empty attribute `alt`.
    if (!/\balt(?:=|\s|>)/.test(match[0])) imagesWithoutAlt.add(`${file}: ${match[0].slice(0, 240)}`);
  }
  for (const match of html.matchAll(/<time datetime="([^"]+)"/g)) {
    if (new Date(match[1]) > new Date()) futureDatedPages.add(`${file}: ${match[1]}`);
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
  duplicateTitles: [...metadata.titles].filter(([, files]) => files.length > 1),
  duplicateDescriptions: [...metadata.descriptions].filter(([, files]) => files.length > 1),
  duplicateCanonicals: [...metadata.canonicals].filter(([, files]) => files.length > 1),
  badH1Pages,
  invalidJsonLd,
  imagesWithoutAlt: [...imagesWithoutAlt],
  futureDatedPages: [...futureDatedPages],
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
  missingImages.length ||
  report.duplicateTitles.length ||
  report.duplicateDescriptions.length ||
  report.duplicateCanonicals.length ||
  badH1Pages.length ||
  invalidJsonLd.length ||
  imagesWithoutAlt.size
) {
  process.exitCode = 1;
}
