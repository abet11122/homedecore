// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { SITE } from './src/site.ts';

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
      // Keep every article URL in the sitemap so existing Pinterest-linked
      // routes remain discoverable. Thin tag archives stay excluded.
      filter: (page) => !page.includes('/tag/'),
    }),
    styledSitemaps(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
