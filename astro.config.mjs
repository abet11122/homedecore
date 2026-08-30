// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Change this to your real domain before deploying.
// It powers canonical URLs, Open Graph tags and sitemap.xml.
const SITE = process.env.SITE_URL || 'https://yourdomain.com';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    // We ship our own preflight + base styles from src/styles/global.css
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
