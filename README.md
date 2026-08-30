# Hearth & Grain — a Pinterest-first home decor blog

A static, editorial-styled interiors blog built with **Astro 7** and **Tailwind CSS 3**, tuned for the two numbers that decide AdSense income: **page speed** and **pageviews per session**.

Ships **zero JavaScript bundles** — the only scripts on the page are a handful of inline snippets totalling well under 2KB, plus the deferred AdSense and Pinterest tags.

---

## Quick start

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:4321`). Ads render as labelled placeholders until you add your AdSense ID — at the exact same size, so the layout you see in dev is the layout you get in production.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site locally |

---

## Where to paste your AdSense ID

**One place: `.env`.**

```
PUBLIC_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
```

That's it. The ID flows into the deferred `adsbygoogle.js` tag in `src/layouts/Layout.astro` and into every `<AdSlot>` on the site. The `PUBLIC_` prefix is required — Astro only exposes prefixed vars to the browser.

Optionally add the per-unit slot IDs (`PUBLIC_ADSENSE_SLOT_IN_ARTICLE_TOP` and friends) so each placement reports separately in AdSense.

### Where the ads sit

| Placement | Mobile | Desktop | Where |
|---|---|---|---|
| `feed` | 336×280 | 728×90 | Homepage and category pages, after the lead block |
| `in-article-top` | 336×280 | 728×90 | After the table of contents |
| `in-article-mid` | 336×280 | 336×280 | After the article body |
| `before-related` | 336×280 | 728×90 | Above the related-posts block |
| `anchor` | 320×50 | hidden | Sticky bottom bar, mobile only |

Every slot reserves its exact height in CSS **before** any script runs (`src/components/AdSlot.astro`), which is what holds CLS at zero. On mobile, `body` gets 60px of bottom padding so the sticky anchor never covers text.

To move or add a slot:

```astro
---
import AdSlot from '../components/AdSlot.astro';
---
<AdSlot placement="in-article-mid" class="my-12" />
```

### AdSense will reject you without these

All four already exist and are linked in the footer — **read them and edit them to match your actual business** before applying:

- `/about/` · `/contact/` · `/privacy-policy/` · `/disclosure/`

The privacy and disclosure pages are templates, not legal advice. Have someone qualified review them for your jurisdiction.

---

## How to add a post

Create `src/content/posts/your-post-slug.md`. The filename becomes the URL: `/post/your-post-slug/`.

```markdown
---
title: "Your Headline Here"
description: "50–200 characters. Used for the meta description, the card excerpt and the article dek."
category: "living-room"
tags: ["tag-one", "tag-two"]
publishDate: 2026-09-01
updatedDate: 2026-09-04     # optional
heroImage: "photo-1600210492486-724fe5c67fb0"
pinImage: "photo-1616486338812-3dadae4b4ace"
featured: false
affiliateDisclosure: false
---

Your opening paragraph. This one gets a drop cap automatically, so make it count.

## A section heading

Level-2 headings are collected into the table of contents at the top of the
article, so the structure of your `##` headings *is* the article's navigation.

### A subheading

- Bullet lists get a small clay dash instead of a dot
- Numbered lists get serif numerals

> A blockquote renders as a large italic pull quote.

Link to another post with a normal Markdown link: [see this guide](/post/paint-colour-guide/).
```

Astro validates every field against a Zod schema (`src/content.config.ts`) at build time. A missing field or a typo'd category **fails the build with a clear message** rather than shipping broken.

### Frontmatter reference

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Under 90 characters (search results truncate past that) |
| `description` | yes | 50–200 characters; enforced |
| `category` | yes | One of: `living-room`, `bedroom`, `kitchen`, `small-spaces`, `diy-decor`, `seasonal` |
| `tags` | no | Array of strings; shown under the article and searchable |
| `publishDate` | yes | `YYYY-MM-DD` |
| `updatedDate` | no | Shown in the byline and in the Article schema |
| `heroImage` | yes | **Horizontal.** Unsplash photo ID or absolute URL |
| `pinImage` | yes | **Vertical 2:3.** Becomes `og:image` and the Pinterest save target |
| `featured` | no | `true` promotes it to the homepage lead slot |
| `affiliateDisclosure` | no | `true` shows the FTC disclosure banner above the body |

### About images

Both image fields take either a bare **Unsplash photo ID** (`photo-1600210492486-724fe5c67fb0` — the part after `unsplash.com/`) or a full URL to your own image.

Using the Unsplash ID form is strongly preferred, because `src/components/Img.astro` then generates a full `srcset` and appends `auto=format` — Unsplash's CDN negotiates **AVIF → WebP → JPEG** from the browser's `Accept` header, so modern browsers get AVIF and older ones fall back automatically. Width and height are always emitted, so the box is reserved before the bytes land.

`pinImage` should be a genuinely vertical 2:3 crop (1000×1500). It becomes your `og:image`, which is what Pinterest saves — a horizontal hero pinned to a 2:3 slot performs badly.

**Before shipping any image, check the photo actually depicts the subject.** A working URL is not the same as a relevant picture.

### Adding a category

1. Add an entry to `CATEGORIES` in `src/site.ts` (slug, name, blurb, tile image)
2. Add the slug to the `category` enum in `src/content.config.ts`

Nav, footer, tiles, category page and sitemap all pick it up automatically.

---

## Rebranding

Nearly everything lives in **`src/site.ts`** — site name, tagline, author, bio, social URLs, the six categories and their tile images. Change it there and it propagates through the header, footer, schema, author box and about page.

Colours and type are in `tailwind.config.mjs`:

```js
paper: '#FBF8F4'   // page background
sand:  '#F4EEE6'   // subtle surface
rule:  '#E5DCD0'   // hairlines
ink:   '#1F1B17'   // headings   (ink-60 body, ink-40 meta, ink-20 faint)
clay:  '#B05B38'   // accent
sage:  '#7C8A72'
```

Fonts are Playfair Display (display) and Inter (body), loaded in `Layout.astro`.

---

## Pinterest setup

1. **Domain verification** — paste your code into `pinterestVerification` in `src/site.ts`; it renders as `<meta name="p:domain_verify">`. Then claim the domain at Pinterest → Settings → Claimed accounts.
2. **Rich Pins** — already wired. Every post ships full Open Graph plus `Article` JSON-LD. Validate one URL at the [Rich Pins validator](https://developers.pinterest.com/tools/url-debugger/).
3. **Save button** — `pinit.js` loads deferred; each post has a 2:3 pin image with a Save button that opens the Pinterest composer.

---

## SEO

Automatic: `sitemap-index.xml`, `robots.txt`, canonical URLs, `Article` / `Organization` / `BreadcrumbList` JSON-LD, Open Graph, Twitter cards, semantic HTML with exactly one `<h1>` per page.

Manual, before launch:

- Set `SITE_URL` in `.env` **and** the `Sitemap:` line in `public/robots.txt`
- Add your Search Console code to `googleVerification` in `src/site.ts`
- Submit `https://yourdomain.com/sitemap-index.xml` to Search Console

---

## GDPR consent

`Layout.astro` sets **Google Consent Mode v2** defaults to `denied` for all ad and analytics storage, with `wait_for_update: 500`. Nothing is stored until a choice is made.

To switch on the banner: in AdSense go to **Privacy & messaging → GDPR**, create a message, publish it, and Google serves the certified CMP to EEA/UK/Swiss visitors automatically through the AdSense tag already on the page. No code change needed.

---

## Deploying

### Netlify

Push to GitHub, then New site from Git:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `SITE_URL`, `PUBLIC_ADSENSE_CLIENT_ID`

### Cloudflare Pages

Workers & Pages → Create → Pages → connect the repo:

- Build command: `npm run build`
- Output directory: `dist`
- Same environment variables

Both free tiers serve this comfortably — it is pure static output with no server runtime.

---

## Connecting the demo forms

The newsletter and contact forms are **not wired up**; they show a note saying so.

**Netlify Forms** — add `netlify` and `name="contact"` to the `<form>` in `src/pages/contact.astro`, plus a hidden `form-name` input, and remove the inline `submit` handler at the bottom of the file.

**Formspree / ConvertKit / Buttondown** — set the form's `action` to your endpoint and `method="POST"`, and delete the inline handler.

---

## Performance notes

Current build: **26 pages, no JS bundles, ~26KB of CSS** (roughly 6KB gzipped, and inlined automatically when small enough).

What keeps it fast, and what to preserve if you edit:

- **Every `<img>` carries `width` and `height`.** Use the `Img` component and this is automatic.
- **Every ad slot has a fixed CSS height.** Never let an ad box size itself.
- **The `<h1>` paints before the hero image** on post pages, so LCP is text.
- **Only the hero is `loading="eager"`**; everything below the fold is lazy.
- **AdSense and Pinterest are `async defer`** and never block the first paint.
- The mobile menu is a CSS-only `<details>` element — no JavaScript.

Verify with `npm run build && npm run preview`, then run Lighthouse in mobile mode against the preview URL. Test against the *built* site, never the dev server — dev ships unminified CSS and an HMR client.

---

## Project structure

```
src/
├─ components/
│  ├─ AdSlot.astro            Reserved-height AdSense slot
│  ├─ AffiliateDisclosure.astro
│  ├─ AuthorBox.astro
│  ├─ Breadcrumbs.astro       Renders BreadcrumbList JSON-LD too
│  ├─ Img.astro               srcset + AVIF/WebP + explicit dimensions
│  ├─ Newsletter.astro
│  ├─ PinterestButton.astro   2:3 pin image + Save button
│  ├─ PostCard.astro          default / wide / compact variants
│  ├─ RelatedPosts.astro      Same category, topped up if thin
│  ├─ SectionHead.astro
│  └─ TableOfContents.astro   Built from the post's h2 headings
├─ content/
│  └─ posts/                  ← your Markdown goes here
├─ content.config.ts          Zod schema for frontmatter
├─ layouts/
│  ├─ Layout.astro            Head, meta, schema, header, footer
│  ├─ PageLayout.astro        Static pages
│  └─ PostLayout.astro        The money page
├─ pages/
│  ├─ index.astro
│  ├─ 404.astro
│  ├─ about / contact / disclosure / privacy-policy .astro
│  ├─ search.astro            Client-side filter over a prebuilt index
│  ├─ category/[slug].astro
│  └─ post/[slug].astro
├─ site.ts                    ← site config and categories
└─ styles/global.css          Design tokens and article typography
```

---

## Troubleshooting

**Build fails with a Zod error** — a post's frontmatter is wrong. The message names the file and the field. Usually a `description` outside 50–200 characters or a category not in the enum.

**Ads not showing in production** — check `PUBLIC_ADSENSE_CLIENT_ID` is set in your host's environment variables (not just your local `.env`), that the site is approved in AdSense, and that all four legal pages are live. Approval takes days, not minutes.

**Images 404** — the Unsplash photo ID is wrong. Test it: `https://images.unsplash.com/PHOTO-ID?w=100` should return an image.

**Stale content after editing a post** — `rm -rf .astro dist` and rebuild.

---

## Licence

Template code is free to use and modify. The sample posts are placeholder editorial content — replace them with your own. Photography is from [Unsplash](https://unsplash.com/license) under the Unsplash License.
