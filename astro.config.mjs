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
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
