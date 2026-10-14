# AdSense remediation plan — approved baseline

Audit date: 14 October 2026 (Asia/Karachi). This plan was presented before changes and then authorized by the user's “fix issues” instruction. The original proposed workflow is preserved below; see [FIXES.md](FIXES.md) for the actual changes, verification and remaining owner work. Deployment has not been performed.

## Proposed decisions

151 posts: **49 KEEP+IMPROVE, 80 MERGE, 22 REMOVE**. `triage.csv` lists every decision, exact destination URL, and reason. All merge destinations are retained posts; there are no proposed redirect chains. Decisions are editorial recommendations, not declarations of Google policy violations.

Keep distinct practical subjects across bedrooms, living rooms, kitchen/bathroom storage, small spaces, entryways, renter upgrades, outdoor areas, DIY and seasonal decor. Preserve the laundry-room article. Consolidate overlapping neutral-bedroom, boys-bedroom, apartment-storage, bathroom-organization and seasonal articles.

Halloween consolidates into four retained guides: small-apartment decor without damage, door decor, yard decor and elegant decor. Their scope must be expanded with genuinely useful material from the proposed sources before any redirect. Several merges broaden the current destination, especially entryways, outdoor seating and Christmas small-space decor: re-review their scope before implementation and retain a source separately if a useful distinct intent would otherwise be lost.

Remove the 22 costume, gifting/basket and children-activity posts listed in `triage.csv`. These are off-topic for this publication, not inherently prohibited by AdSense. Proposed initial treatment: **noindex, follow**, retain the full readable article at its URL, and remove it from promotional navigation, sitemap and RSS. Do not block those URLs in robots.txt, since crawlers must see noindex. No 410 or physical deletion is proposed in this first pass. Permanent retirement can be considered separately after checking traffic and backlinks.

## Implementation after approval

1. Review useful distinct material in each merge group. Improve retained destinations first, without generating new articles or inventing experience. Keep all factual claims subject to source checking. Check Search Console/analytics/backlink data before implementing removals; no such account evidence was available during this audit.
2. Add the 80 approved 301 mappings with an explicit 301 status; the hosting provider's generic `permanent` flag may produce 308 instead. Verify each deployed status and destination. Apply noindex to the 22 removal candidates. Keep an exact route manifest for rollback and reconciliation.
3. Update sitemap index/child sitemap, RSS, home/archive/category/tag pages, search data, related links, breadcrumbs and all body links together. Link directly to retained destinations. Exclude search, 404, thin utility/tag pages and removed articles from the sitemap. `/sitemap.xml` currently returns 404; the working `/sitemap-index.xml` is the actual advertised endpoint, so do not replace it unnecessarily.
4. Apply `keep-input-plan.csv` as an unpublished editorial worksheet for every retained post. It contains all four requested placeholders and six proposed page structures. Put owner-input placeholders in drafts or editorial notes; publishing them as finished content would not solve low value. Raise depth through reader constraints, actual steps, alternatives, limitations, sources and evidence rather than word padding. Stock-only status remains until genuine photos and provenance are supplied.
5. Replace unsubstantiated Elena identity, twelve-year styling claim and stock author portrait with an honest **Editorial Team** byline, accurately typed Organization structured data, and no human portrait. Audit explicit Elena references in About, author archive, layouts, RSS and metadata. Preserve the current author route until a separately approved redirect is available. Ownership still needs `[REAL OWNER NAME]`, `[REAL BACKGROUND]` and optionally `[MY REAL PHOTO]`; do not imply multiple staff if only one person operates the site.
6. Rewrite About with verified facts and clearly marked owner-input fields for the actual workflow, research sources, use of AI if applicable, editorial checking, stock-photo licensing and corrections process. Do not claim hands-on testing, real projects or independent product evaluation without evidence.
7. Existing `/terms/` needs a footer link and accuracy review; it is not necessary to create a second competing page. Its advertising statements and June 2025 revision date require checking. Contact already publishes a mailto Gmail address. Retain it only if monitored; provide `[DOMAIN EMAIL: configure a monitored address before publishing]` in editorial notes. Do not publish an unconfigured contact form or claim delivery works without a real test.
8. Remove `onthecorner` as an editorial label and update affected navigation; currently its live route is noindex. Source already suppresses single-post tag hubs (current templates use a minimum of three with a special exception). Recount after triage. Any existing tag retirement/redirect must be part of the approved mapping.
9. Self-host licensed image derivatives with attribution/provenance records, responsive sizes and reserved dimensions. Local Pexels derivatives are still stock. Validate actual alt descriptions against each image; empty alt can be correct for decorative images.
10. Recheck build output and live routes, canonical targets, one H1, crawl reachability, sitemap/RSS membership, noindex behavior, image delivery and mobile layouts. Run a real browser/Lighthouse or PageSpeed check; fetch timings in the CSV are not page-speed or Core Web Vitals scores.

## Owner input needed

- Actual room/project photos and permission to publish them.
- Measurements, receipts or recorded costs, currency/location/date, and actual time spent.
- What you tried, mistakes/failures, changes made and results.
- Your preference and reasons for picking an option.
- Actual owner/author identity, background, portrait if wanted, production workflow, monitored contact address and image rights evidence.
- Search Console and analytics evidence for valuable traffic/backlinks before final retirement decisions.

AdSense eligibility is not established by keeping 49 posts, meeting a word count, or inserting placeholders. Reapply only after meaningful evidence-backed improvements and the unresolved checks in REPORT.md are complete.
