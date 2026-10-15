# SEO and design review — October 15, 2026

## Changes completed

| Area | Finding and fix |
| --- | --- |
| Pinterest saves | Replaced the JavaScript-only button with a standard link. Saved pins use the existing production canonical and local pin image, excluding tracking parameters, section fragments and preview hosts. The Save button remains visible and works without JavaScript. |
| Structured data | Collection and author-profile information now extend a single page entity. Removed competing page entities and duplicate IDs; article references resolve to the same canonical page. Escaped less-than characters when serializing the shared JSON-LD. |
| Search and archive | Consolidated filtering into a shared controller. Normalized accents, punctuation and hyphens in both story text and queries. Added selected-state announcements, result status, clear filters, and query/room URL state that survives refresh. All stories remain available without JavaScript. |
| Article reading | Made the mobile contents list expandable, removed duplicate numbers from numbered contents labels, marked the current desktop section for assistive technology, and remeasured section positions after fonts load. Removed the unused third desktop column; the article remains within the page wrapper. Heading IDs and article text are preserved. |
| Navigation | Header disclosures close with Escape, outside clicks and link activation. Escape returns keyboard focus to the menu control. Native disclosures still work without JavaScript. |
| Small screens | Fixed tablet hero corners and contact email wrapping at 320px. Improved filter touch targets and search shortcuts. |
| Story cards | Cards now use flexible content columns so metadata can sit at the bottom. Search results use the descriptive hero-image alt text when provided. |
| Print | The former blanket header rule hid article titles. Print now hides the masthead specifically and uses a single article column while retaining the headline and takeaways. |
| Homepage | Clearer home-decor heading and browsing actions, room shortcuts, a featured-story share image, and evergreen text instead of a date frozen at build time. |
| Author metadata | Replaced an overly long author-page meta description with a concise description of the page. |

## URL protection

No changes were made to post Markdown files, blog slugs, post route generation, the site domain, verification settings, redirect configuration, or Astro routing configuration. Existing retired-post redirects are preserved. No additional redirects or article removals were introduced.

Search query strings describe filter state only; the canonical search/archive paths remain unchanged. Pinterest links target each article's original canonical URL.

## Verification

- `npm.cmd run build`: production build and existing SEO/remediation checks.
- Existing browser review: 24 page/viewport combinations at 360, 768 and 1440px, with no detected overflow, broken images or incorrect H1 counts.
- `node scripts/verify-seo-design.mjs`: 109 built pages checked for page-entity consistency, 71 server-rendered Pinterest links checked against their canonicals, and 18 additional page/viewport checks at 320, 1024 and 1536px.
- Both search screens tested for initial query and room selection, equivalent hyphenated/spaced searches, empty results, clearing filters, restored result counts and focus.
- Article contents, clean Pinterest URLs from tracked visits, print titles, Escape/outside-click dismissal and article availability without JavaScript checked in Chrome.
- No JavaScript exceptions detected in the expanded browser checks. The recorded expanded review has zero failures; see `validation.json`.
- `git diff --check` used to check patch whitespace. Protected route/configuration paths checked for changes.

## Remaining content and publishing considerations

The existing audit identifies 38 published articles in the sitemap and 28 retained source articles on editorial hold. The holds and existing indexability decisions are preserved. Source counts in the older remediation report also include files already marked for merge/removal; these are not newly removed pages.

Original project photographs, actual measurements, costs and first-hand observations remain an editorial opportunity. Existing worksheets in `src/editorial/posts/` describe the missing input. This review does not invent those experiences, publish held drafts, or claim that stock photographs document completed projects.

The changes are local and have not been deployed. Browser checks are unthrottled local checks, not a Lighthouse score or field Core Web Vitals measurement. Search ranking, production indexing, account verification and Pinterest's processing of existing pins were not tested through the owner's accounts.
