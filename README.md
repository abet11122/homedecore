# Cozy Nest Ideas

An Astro and Tailwind home decor publication for [cozynestideas.online](https://www.cozynestideas.online/).

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
cp .env.example .env
npx astro dev --background
```

Use `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` to manage the background server. Run `npm run build` to produce the static site in `dist/` and check its sitemap, links, metadata, indexing and ad-loader rules. The build exits with an error if the audit finds a problem.

## Site settings

The public name, canonical origin, categories and optional contact or social links live in `src/site.ts`. The canonical origin is fixed to `https://www.cozynestideas.online`; `astro.config.mjs` uses that value for the sitemap and metadata. `public/robots.txt` lists the same domain.

The contact email is set in `src/site.ts`; Pinterest and Instagram are still empty. The contact page links directly to the email address and does not display an unconnected form. Before enabling a contact form or newsletter, connect a real service and update the privacy policy to match.

## Posts and images

Add an article as `src/content/posts/<slug>.md`. Its frontmatter is validated by `src/content.config.ts`. The `heroImage` and `pinImage` fields accept a local path such as `/images/posts/<slug>/hero.webp`, a full image URL, or an Unsplash photo ID. Set `heroImageAlt` to a description of the actual image. Use a horizontal image for the hero and a vertical 2:3 image for the Pinterest crop.

Articles marked `editorialReady: false` remain reachable at their existing URLs but are excluded from navigation and the sitemap, marked `noindex`, and do not load AdSense. Set this field to `true` only after checking that the article provides distinct, accurate guidance and does not repeat other articles. Static sites require a fresh deployment after a scheduled publish date; the build cannot update an already deployed page by itself.

The approved triage is recorded as `disposition: keep`, `merge`, or `remove` in frontmatter. Merged routes are omitted from the static build and have explicit 301 mappings in `vercel.json`. Removed articles remain readable but are noindex and excluded from navigation, sitemap and RSS. Existing editorial holds remain. The empty DIY category is suppressed until a guide passes review; restore it in `src/site.ts` and retire its archive redirect at that time.

Private input worksheets live in `src/editorial/posts/`; ownership and workflow inputs are listed in `src/editorial/OWNER-INPUT.md`. These files do not create website pages. `scripts/apply-editorial-fixes.mjs` is a completed, one-time migration and intentionally refuses to run again over subsequent corrections. The original source backup is in `audits/adsense/pre-remediation/`.

Images are served from local assets. `npm run images:self-host` rebuilds the stock cache with network access; provider provenance is recorded in `src/data/stock-images.json`. Self-hosting does not change stock photography into original work. `npm run build` also verifies migration rules, noindex, disclosures, local image references and the absence of ad code.

The selected local Pexels image sources are recorded in `IMAGE_SOURCES.md`. To regenerate those WebP crops:

```bash
python -m pip install -r scripts/image-requirements.txt
python scripts/refresh_post_images.py
```

The homepage hero and post cards use local images when specified in frontmatter, so their display does not depend on a remote image CDN.

## Advertising and legal pages

Advertising is disabled during editorial remediation. No AdSense loader or slot renders, regardless of environment variables. Do not enable ads on unfinished articles or utility pages.

Review `/privacy-policy/` and `/disclosure/` against the actual hosting, analytics, advertising and affiliate setup before publishing changes to those services. The content of those pages is a starting point, not legal advice.

## Deployment checks

Build with `npm run build`, then verify `/sitemap-index.xml`, `/robots.txt`, an article's canonical link, and its social image URL. Submit [the sitemap](https://www.cozynestideas.online/sitemap-index.xml) in the site's search console when the new build is live.
