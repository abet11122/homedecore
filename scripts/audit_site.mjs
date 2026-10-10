import fs from 'node:fs';
import path from 'node:path';

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const legacyRedirect = vercelConfig.redirects?.find(
  (rule) =>
    rule.source === '/:path*' &&
    rule.destination === 'https://www.cozynestideas.online/:path*' &&
    rule.permanent === true &&
    rule.has?.some(
      (condition) =>
        condition.type === 'host' && condition.value === 'homedecore-neon.vercel.app'
    )
);
const configuredSecurityHeaders = new Set(
  (vercelConfig.headers ?? [])
    .flatMap((rule) => rule.headers ?? [])
    .map((header) => header.key.toLowerCase())
);
const requiredSecurityHeaders = [
  'x-content-type-options',
  'referrer-policy',
  'x-frame-options',
  'permissions-policy',
];
const missingSecurityHeaders = requiredSecurityHeaders.filter(
  (header) => !configuredSecurityHeaders.has(header)
);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  );

const markdown = walk('src/content/posts').filter((file) => file.endsWith('.md'));
const sourcePosts = markdown.map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const publishDate = source.match(/^publishDate:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
  const url = `https://www.cozynestideas.online/post/${path.basename(file, '.md')}/`;
  return { file, publishDate, url };
});

const expectedPostRoutes = new Set(sourcePosts.map((post) => post.url));
const expectedIndexedPosts = new Set(
  sourcePosts
    .filter((post) => post.publishDate && new Date(`${post.publishDate}T00:00:00.000Z`) <= new Date())
    .map((post) => post.url)
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

const missingFromSitemap = [...expectedIndexedPosts].filter((url) => !sitemapPosts.has(url));
const extraPostUrls = [...sitemapPosts].filter((url) => !expectedIndexedPosts.has(url));
const missingPostRoutes = [...expectedPostRoutes].filter((url) => {
  const pathname = new URL(url).pathname;
  return !localUrlExists(pathname);
});

const htmlFiles = walk('dist').filter((file) => file.endsWith('.html'));
let missingTitles = 0;
let missingDescriptions = 0;
let missingCanonicals = 0;
let missingLanguageAlternates = 0;
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
const publishedPostsMarkedNoindex = [];
const scheduledPostsMissingNoindex = [];
const unexpectedAdLoaderPages = [];
const publishedPostsMissingAdLoader = [];

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
  if (!/<link rel="alternate" hreflang="en" href="[^"]+"/.test(html)) {
    missingLanguageAlternates += 1;
  }
  if (!/<link rel="alternate" hreflang="x-default" href="[^"]+"/.test(html)) {
    missingLanguageAlternates += 1;
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
  if (
    html.includes('pagead2.googlesyndication.com') &&
    !file.includes(`${path.sep}post${path.sep}`)
  ) {
    unexpectedAdLoaderPages.push(file);
  }
}

for (const post of sourcePosts) {
  const pathname = new URL(post.url).pathname;
  const file = path.join('dist', ...pathname.split('/').filter(Boolean), 'index.html');
  if (!fs.existsSync(file)) continue;

  const html = fs.readFileSync(file, 'utf8');
  const isScheduled = new Date(`${post.publishDate}T00:00:00.000Z`) > new Date();
  const isNoindex = /<meta name="robots" content="noindex, follow"/.test(html);
  if (isScheduled && !isNoindex) scheduledPostsMissingNoindex.push(post.url);
  if (!isScheduled && isNoindex) publishedPostsMarkedNoindex.push(post.url);
  if (!isScheduled && !html.includes('pagead2.googlesyndication.com')) {
    publishedPostsMissingAdLoader.push(post.url);
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
  validLegacyDomainRedirect: Boolean(legacyRedirect),
  missingSecurityHeaders,
  sourcePosts: expectedPostRoutes.size,
  publishedPosts: expectedIndexedPosts.size,
  scheduledPosts: expectedPostRoutes.size - expectedIndexedPosts.size,
  sitemapPosts: sitemapPosts.size,
  missingFromSitemap,
  extraPostUrls,
  missingPostRoutes,
  htmlPages: htmlFiles.length,
  missingTitles,
  missingDescriptions,
  missingCanonicals,
  missingLanguageAlternates,
  badCanonicals,
  brokenInternalLinks: [...brokenLinks],
  missingLocalImages: missingImages,
  duplicateTitles: [...metadata.titles].filter(([, files]) => files.length > 1),
  duplicateDescriptions: [...metadata.descriptions].filter(([, files]) => files.length > 1),
  duplicateCanonicals: [...metadata.canonicals].filter(([, files]) => files.length > 1),
  badH1Pages,
  invalidJsonLd,
  imagesWithoutAlt: [...imagesWithoutAlt],
  publishedPostsMarkedNoindex,
  scheduledPostsMissingNoindex,
  unexpectedAdLoaderPages,
  publishedPostsMissingAdLoader,
  futureDatedPages: [...futureDatedPages],
};

console.log(JSON.stringify(report, null, 2));
if (
  !legacyRedirect ||
  missingSecurityHeaders.length ||
  missingFromSitemap.length ||
  extraPostUrls.length ||
  missingPostRoutes.length ||
  missingTitles ||
  missingDescriptions ||
  missingCanonicals ||
  missingLanguageAlternates ||
  badCanonicals.length ||
  brokenLinks.size ||
  missingImages.length ||
  report.duplicateTitles.length ||
  report.duplicateDescriptions.length ||
  report.duplicateCanonicals.length ||
  badH1Pages.length ||
  invalidJsonLd.length ||
  imagesWithoutAlt.size ||
  publishedPostsMarkedNoindex.length ||
  scheduledPostsMissingNoindex.length ||
  unexpectedAdLoaderPages.length ||
  publishedPostsMissingAdLoader.length
) {
  process.exitCode = 1;
}
