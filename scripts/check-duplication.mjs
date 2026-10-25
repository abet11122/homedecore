/*
  Duplication and voice check for the published articles.

  This site was rejected for low value content. The cause is not post length —
  every live article is over a thousand words — it is text repeated across many
  articles here, and shared with the sister sites. This script measures that.

  A sentence counts as repeated when 12 or more words match after case,
  punctuation and whitespace are normalised. Twelve is long enough that a match
  is reuse rather than a coincidence of common phrasing.

  Usage:
    node scripts/check-duplication.mjs
    node scripts/check-duplication.mjs --verbose     # list every shared sentence
    node scripts/check-duplication.mjs --all         # include unpublished drafts

  Sister sites are read from SISTER_SITES (semicolon-separated) or the defaults
  below, and each is skipped if the path is absent.
*/
import fs from 'node:fs';
import path from 'node:path';

const POSTS = 'src/content/posts';
const MIN_WORDS = 12;
const VERBOSE = process.argv.includes('--verbose');
const INCLUDE_DRAFTS = process.argv.includes('--all');

const DEFAULT_SISTERS = [
  'C:/Users/mmuba/OneDrive/Desktop/home_decore',
  'D:/my sites/pintrest/Asad_home_decore',
];
const sisterRoots = (process.env.SISTER_SITES ? process.env.SISTER_SITES.split(';') : DEFAULT_SISTERS)
  .map(s => s.trim()).filter(Boolean);

const BANNED = [
  'transform', 'instantly', 'stunning', 'curated', 'elevate', "whether you're",
  'whether you are', 'a touch of', 'when it comes to', 'game-changer',
  'game changer', 'effortlessly', 'breathtaking', 'must-have', 'nestled',
];

/** Visible prose only: no frontmatter, HTML comments, code or link targets. */
function prose(raw) {
  const parts = raw.split(/^---\s*$/m);
  const body = parts.length > 2 ? parts.slice(2).join('---') : raw;
  return body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // The affiliate product widget is a component, not writing. Its disclosure
    // line and its call to action are meant to read identically on every post,
    // so counting them as repeated prose only hides the real repetition.
    .replace(/<div class="shop-look-wrap">[\s\S]*?<\/div>\s*<\/div>/g, ' ')
    .replace(/<div class="shop-look-wrap">[\s\S]*?<\/div>/g, ' ')
    // Any other inlined HTML is markup rather than prose.
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>|]/g, ' ');
}

const words = t => (t.match(/\b[\w'-]+\b/g) || []).length;

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n\n+/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => words(s) >= MIN_WORDS)
    .map(s => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim());
}

/** Mirrors isPublished() in src/site.ts. */
function isPublished(raw) {
  const disposition = raw.match(/^disposition:\s*["']?([a-z-]+)/m)?.[1] ?? 'keep';
  if (disposition !== 'keep') return false;
  if (/^editorialReady:\s*false\s*$/m.test(raw)) return false;
  const date = raw.match(/^publishDate:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  return Boolean(date) && Date.parse(`${date}T00:00:00Z`) <= Date.now();
}

function readDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ slug: f.slice(0, -3), file: path.join(dir, f), raw: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

/** Every markdown file under a posts directory, including nested folders. */
function readTree(base) {
  if (!fs.existsSync(base)) return [];
  let out = readDir(base);
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) out = out.concat(readDir(path.join(base, entry.name)));
  }
  return out;
}

const all = readTree(POSTS);
const live = INCLUDE_DRAFTS ? all : all.filter(p => isPublished(p.raw));

let failures = 0;
console.log(`\n${live.length} published of ${all.length} files${INCLUDE_DRAFTS ? ' (--all: drafts included)' : ''}\n`);

// ---------------------------------------------------------------- within site
const own = new Map();
for (const p of live) {
  for (const s of new Set(sentences(prose(p.raw)))) {
    if (!own.has(s)) own.set(s, []);
    own.get(s).push(p.slug);
  }
}
const internal = [...own.entries()].filter(([, s]) => s.length >= 2).sort((a, b) => b[1].length - a[1].length);
console.log(`Repeated within this site (${MIN_WORDS}+ words, 2+ articles): ${internal.length}`);
if (internal.length) {
  failures++;
  console.log(`  articles involved: ${new Set(internal.flatMap(([, s]) => s)).size} of ${live.length}`);
  for (const [s, slugs] of internal.slice(0, VERBOSE ? Infinity : 12)) {
    console.log(`  [${slugs.length}] ${s.slice(0, 95)}`);
    if (VERBOSE) console.log(`        ${slugs.join(', ')}`);
  }
}

/*
  A sister site's withheld drafts are not on the internet, so text shared with
  them is not duplicate content. Compare against what each one actually
  publishes: its built dist/post/ pages where a build exists, falling back to
  the markdown tree when it does not.
*/
function sisterPublished(root) {
  const dist = path.join(root, 'dist/post');
  if (fs.existsSync(dist)) {
    const out = [];
    for (const slug of fs.readdirSync(dist)) {
      const f = path.join(dist, slug, 'index.html');
      if (!fs.existsSync(f)) continue;
      const html = fs.readFileSync(f, 'utf8');
      if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;
      const main = (html.match(/<article[\s\S]*?<\/article>/) || html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
      const text = main
        .replace(/<script[\s\S]*?<\/script>/g, ' ')
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ');
      out.push({ slug, raw: `---\n---\n${text}` });
    }
    return { posts: out, source: 'built pages' };
  }
  return { posts: readTree(path.join(root, 'src/content/posts')), source: 'markdown' };
}

// --------------------------------------------------------------- sister sites
for (const root of sisterRoots) {
  const { posts, source } = sisterPublished(root);
  if (!posts.length) { console.log(`\n(skipped, nothing found: ${root})`); continue; }
  const index = new Set();
  posts.forEach(p => sentences(prose(p.raw)).forEach(s => index.add(s)));
  const shared = new Map();
  for (const p of live) {
    const hits = [...new Set(sentences(prose(p.raw)))].filter(s => index.has(s));
    if (hits.length) shared.set(p.slug, hits);
  }
  const distinct = new Set([...shared.values()].flat());
  console.log(`\nShared with ${path.basename(root)} (${posts.length} live, from ${source}): ${distinct.size} sentences across ${shared.size} articles`);
  if (distinct.size) {
    failures++;
    for (const [slug, hits] of [...shared].sort((a, b) => b[1].length - a[1].length).slice(0, VERBOSE ? Infinity : 15)) {
      console.log(`  ${String(hits.length).padStart(3)}  ${slug}`);
    }
  }
}

// ---------------------------------------------------------------------- voice
console.log('\nVoice and structure:');
const bannedHits = [];
const headings = new Map();
for (const p of live) {
  const text = prose(p.raw).toLowerCase();
  for (const w of BANNED) {
    const n = text.split(w).length - 1;
    if (n) bannedHits.push(`${p.slug}: ${w} x${n}`);
  }
  const body = p.raw.split(/^---\s*$/m).slice(2).join('---');
  for (const m of body.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    const h = m[1].trim();
    headings.set(h, (headings.get(h) || 0) + 1);
  }
}
const reused = [...headings].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
console.log(`  banned phrases: ${bannedHits.length}`);
bannedHits.slice(0, VERBOSE ? Infinity : 10).forEach(h => console.log(`    ${h}`));
console.log(`  headings reused across articles: ${reused.length}`);
reused.slice(0, VERBOSE ? Infinity : 10).forEach(([h, n]) => console.log(`    [${n}] ${h}`));
if (bannedHits.length || reused.length) failures++;

console.log(failures ? '\nFAIL — see above.\n' : '\nPASS.\n');
process.exit(failures ? 1 : 0);
