# Cozy Nest Ideas

An Astro and Tailwind home decor publication for [cozynestideas.online](https://www.cozynestideas.online/).

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
cp .env.example .env
npx astro dev --background
```

Use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage the background server. Run `npm run build` to produce the static site in `dist/`.

## Site settings

The public name, canonical origin, categories and optional contact or social links live in `src/site.ts`. The canonical origin is fixed to `https://www.cozynestideas.online`; `astro.config.mjs` uses that value for the sitemap and metadata. `public/robots.txt` lists the same domain.

The contact email is set in `src/site.ts`; Pinterest and Instagram are still empty. The contact page links directly to the email address and does not display an unconnected form. Before enabling a contact form or newsletter, connect a real service and update the privacy policy to match.

## Posts and images

Add an article as `src/content/posts/<slug>.md`. Its frontmatter is validated by `src/content.config.ts`. The `heroImage` and `pinImage` fields accept a local path such as `/images/posts/<slug>/hero.webp`, a full image URL, or an Unsplash photo ID. Set `heroImageAlt` to a description of the actual image. Use a horizontal image for the hero and a vertical 2:3 image for the Pinterest crop.

Articles marked `editorialReady: false` remain reachable at their existing URLs but are excluded from navigation and the sitemap, marked `noindex`, and do not load AdSense. Set this field to `true` only after checking that the article provides distinct, accurate guidance and does not repeat other articles. Static sites require a fresh deployment after a scheduled publish date; the build cannot update an already deployed page by itself.

The selected local Pexels image sources are recorded in `IMAGE_SOURCES.md`. To regenerate those WebP crops:

```bash
python -m pip install -r scripts/image-requirements.txt
python scripts/refresh_post_images.py
```

The homepage hero and post cards use local images when specified in frontmatter, so their display does not depend on a remote image CDN.

## Advertising and legal pages

Copy `.env.example` to `.env` and configure `PUBLIC_ADSENSE_CLIENT_ID` only when the account is ready. Optional placement IDs use the `PUBLIC_ADSENSE_SLOT_*` fields in that file. With no client ID, ad slots show labelled placeholders.

Review `/privacy-policy/` and `/disclosure/` against the actual hosting, analytics, advertising and affiliate setup before publishing changes to those services. The content of those pages is a starting point, not legal advice.

## Deployment checks

Build with `npm run build`, then verify `/sitemap-index.xml`, `/robots.txt`, an article's canonical link, and its social image URL. Submit [the sitemap](https://www.cozynestideas.online/sitemap-index.xml) in the site's search console when the new build is live.
