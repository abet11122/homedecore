/**
 * Fails when two live posts share a heroImage or a pinImage.
 *
 * "Live" means the post is in the sitemap. It uses the same test as the
 * sitemap filter in astro.config.mjs and isPublished() in src/site.ts:
 * disposition keep, not on editorial hold, and dated today or earlier.
 * The same picture on several published posts reads as templated, low-value
 * content, so that case exits 1.
 *
 * Duplicates that involve at most one live post are only warnings: the other
 * posts are noindex or redirected, and are never published.
 *
 *   node scripts/check-unique-images.mjs            summary
 *   node scripts/check-unique-images.mjs --verbose  list every slug involved
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const verbose = process.argv.includes('--verbose');
const postsDirectory = join(process.cwd(), 'src', 'content', 'posts');
const FIELDS = ['heroImage', 'pinImage'];

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : extname(path) === '.md' ? [path] : [];
  });
}

function field(source, name) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const value = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'))?.[1];
  return value?.replace(/^["']|["']$/g, '');
}

function isLive(source) {
  const published = field(source, 'publishDate')?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
  const held = /^editorialReady:\s*false\s*$/m.test(source);
  const disposition = field(source, 'disposition') ?? 'keep';
  if (!published || held || disposition !== 'keep') return false;
  return new Date(`${published}T00:00:00.000Z`).getTime() <= Date.now();
}

const posts = markdownFiles(postsDirectory).map((file) => {
  const source = readFileSync(file, 'utf8');
  return {
    // Matches postSlug(): nested folders such as new_blogs/ are not part of the URL.
    slug: basename(file, '.md'),
    live: isLive(source),
    heroImage: field(source, 'heroImage'),
    pinImage: field(source, 'pinImage'),
  };
});

const live = posts.filter((post) => post.live);
const errors = [];
const warnings = [];

for (const name of FIELDS) {
  const byImage = new Map();
  for (const post of posts) {
    if (!post[name]) continue;
    if (!byImage.has(post[name])) byImage.set(post[name], []);
    byImage.get(post[name]).push(post);
  }
  for (const [image, users] of byImage) {
    if (users.length < 2) continue;
    const liveUsers = users.filter((post) => post.live);
    const otherUsers = users.filter((post) => !post.live);
    if (liveUsers.length > 1) {
      errors.push(`${name} ${image} is shared by ${liveUsers.length} live posts: ${liveUsers.map((p) => p.slug).join(', ')}`);
    } else {
      const liveNote = liveUsers.length ? ` (live: ${liveUsers[0].slug})` : '';
      const list = verbose ? `: ${otherUsers.map((p) => p.slug).join(', ')}` : '';
      warnings.push(`${name} ${image} is shared by ${otherUsers.length} noindex/redirected post(s)${liveNote}${list}`);
    }
  }
}

const samePicture = live.filter((post) => post.heroImage && post.heroImage === post.pinImage);
if (samePicture.length) {
  const list = verbose ? `: ${samePicture.map((p) => p.slug).join(', ')}` : '';
  warnings.push(`${samePicture.length} live post(s) use the same image for heroImage and pinImage${list}`);
}

console.log(`Checked ${posts.length} posts, ${live.length} live (in the sitemap).`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s), not failing:`);
  for (const warning of warnings) console.log(`  warn  ${warning}`);
  if (!verbose) console.log('  (run with --verbose to list the slugs)');
}
if (errors.length) {
  console.error(`\n${errors.length} error(s): live posts must not share images:`);
  for (const error of errors) console.error(`  FAIL  ${error}`);
  process.exit(1);
}
console.log(`\nOK: all ${live.length} live posts have a unique heroImage and a unique pinImage.`);
