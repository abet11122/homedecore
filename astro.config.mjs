// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, postSlug } from './src/site.ts';

const postsDirectory = fileURLToPath(new URL('./src/content/posts/', import.meta.url));

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : extname(path) === '.md' ? [path] : [];
  });
}

// Scheduled posts keep their permanent route, but stay out of discovery and
// the sitemap until their publish date. This keeps every Pinterest URL stable
// without sending crawlers conflicting `noindex` and sitemap signals.
const publishedPostPaths = new Set(
  markdownFiles(postsDirectory)
    .filter((file) => {
      const source = readFileSync(file, 'utf8');
      const value = source.match(/^publishDate:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
      return value ? new Date(`${value}T00:00:00.000Z`).getTime() <= Date.now() : false;
    })
    .map((file) => {
      const id = relative(postsDirectory, file)
        .split(sep)
        .join('/')
        .replace(/\.md$/, '');
      return `/post/${postSlug(id)}/`;
    })
);

function styledSitemaps() {
  return {
    name: 'styled-sitemaps',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const files = (await readdir(dir)).filter((name) => /^sitemap.*\.xml$/.test(name));
        const instruction = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';

        await Promise.all(
          files.map(async (name) => {
            const file = new URL(name, dir);
            const xml = await readFile(file, 'utf8');
            if (xml.includes('<?xml-stylesheet')) return;
            const styled = xml.startsWith('<?xml')
              ? xml.replace(/^(<\?xml[^?]*\?>)/, `$1\n${instruction}`)
              : `${instruction}\n${xml}`;
            await writeFile(file, styled, 'utf8');
          })
        );
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Keep production canonicals and the sitemap on the verified site domain.
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // Tag hubs are useful navigation for readers, but most are short archive
      // pages. Keep the sitemap focused on original articles and core pages.
      // Published article URLs stay discoverable; future-scheduled routes and
      // thin tag archives stay out until they are ready to be indexed.
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/tag/')) return false;
        if (path.startsWith('/post/')) return publishedPostPaths.has(path);
        return true;
      },
    }),
    styledSitemaps(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
