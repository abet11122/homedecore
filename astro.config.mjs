// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site.ts';

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
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
