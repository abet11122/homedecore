# Audit findings and limitations

This is the **pre-remediation audit**, preserved as the baseline. Remediation was subsequently authorized by the user's “fix issues” instruction. See [FIXES.md](FIXES.md) for implemented changes, current validation and outstanding owner inputs. No new articles or AdSense code were added.

## Evidence and method

`audit.csv` inventories all 151 source posts; every article URL returned 200 in the live crawl. The public sitemap and source-derived routes produced a 179-URL snapshot, including utility endpoints. HTML and endpoint responses are saved in `live-snapshot.json`; this file is evidence, not website content.

Body counts come from the live `div.article` container, excluding the separately rendered FAQs, related posts, author box, navigation and takeaways, plus figcaptions and shop cards inside the body. Counts include body headings. They use Unicode word tokens rather than HTML whitespace. Numbered idea headings are the primary list items; their average covers text to the next idea, including intervening section introductions. Posts without numbered ideas use actual HTML list items and their item text. Therefore prose guides with small bullet lists have lower item averages that should not be interpreted as idea-section depth. No post has a body count below 500 under this method; that is not a Google quality threshold.

Image counts are unique hero, pin and inline image references from each source post, excluding author portraits and related cards. `original_image_count=0` means **no verified owner-original images**, not proof that every undocumented asset is stock. 149 posts have entirely identified stock references. Two posts have undocumented references: bathroom-shelf-styling-ideas and kitchen-corner-storage-ideas. Their provenance must be established. Unsplash identifiers and external Unsplash/Pexels URLs are stock; local derivatives are counted as stock where IMAGE_SOURCES.md identifies their source. Hosting location does not determine originality.

`near_duplicate_group` marks overlapping topic intent requiring editorial consolidation. `similarity.csv` separately contains 441 candidates with at least 12% containment of five-word phrases from source body text. Common phrasing and boilerplate can produce candidates. These scores are not proof of plagiarism, scraping, AI authorship, or a spam-policy violation. Full external originality review remains unverified.

## Policy checklist

| Requested check | Status | Evidence / remaining work |
| --- | --- | --- |
| (a) No thin, empty or coming-soon pages | FAIL readiness review | Overlapping shallow idea treatments remain; word counts alone do not establish value. Tag/utility pages require appropriate indexing and ad exclusions. Owner-input placeholders must not be published as completed articles. |
| (b) No copied or scraped content | UNVERIFIED | Internal similarity candidates identified; neither source provenance nor external plagiarism clearance can be established from this crawl. |
| (c) No prohibited content | UNVERIFIED sitewide | No obvious prohibited theme was identified in the home-decor/title review. Costumes are off-topic, not automatically prohibited. Full text, image and destination review remains necessary. |
| (d) No ads planned on search/tags/404/thank-you | PASS within observed scope | No AdSense loader on observed non-article HTML routes. Existing layout limits loaders to published articles. No thank-you route was identified. Existing loaders appeared on 123 article pages; no code was added or changed. |
| (e) Affiliate disclosure near links | FAIL strict proximity check | Source renders a top-of-body disclosure for flagged articles, and shop links use sponsored/nofollow attributes. A top disclosure can be far from later purchase cards; verify every affiliate link and add plain disclosure close to each relevant card/group. |
| (f) Navigation works; every page reachable | UNVERIFIED complete sitewide | All 151 article URLs returned 200; no broken link was found among known crawled targets. This does not verify every asset, external destination, uncrawled tag or JavaScript interaction. Held posts intentionally lack full archive promotion. |
| (g) Truthful author and ownership | FAIL verification | Elena Marsh, the twelve-year claim and the Unsplash portrait lack supplied authenticity evidence. Replace unsupported identity representations and supply real ownership details. |

FAIL here means the requested readiness condition has not been satisfied, not a formal finding issued by Google. UNVERIFIED must not be presented as PASS.

## Technical and trust findings

- robots.txt responds and points to the working sitemap index. `/sitemap.xml` responds 404; this does not invalidate the advertised sitemap index. RSS responds. Sitemap/RSS membership must be regenerated after approved triage.
- ads.txt contains `google.com, pub-8497285724891966, DIRECT, f08c47fec0942fa0`. Format is present; account ownership and authorized seller status need verification in the owner's account. ads.txt is not proof of approval.
- The source already contains an AdSense loader and publisher ID. The live snapshot found it on 123 article pages. Their presence predates this audit. The user prohibited adding ads, and no ad changes have been made.
- `/terms/` exists but the footer's legal links omit it. Contact provides a real-looking mailto address, not a working form; mailbox ownership/delivery were not tested.
- `/tag/onthecorner/` responds 200 and is noindex. Single-post tag suppression already exists in source, but the special onthecorner exception needs removal after approved tag cleanup.
- Successful HTML pages have one H1 and observed canonicals are recorded in technical.csv. Final indexing and canonical consistency require rechecking after consolidation.
- Empty `alt` is emitted by Astro as a bare `alt` attribute on decorative images. The audit accepts that valid HTML serialization; descriptive accuracy is a separate visual review.
- Remote Unsplash/Pexels images remain across the site. Existing image component emits responsive srcsets, explicit dimensions and lazy loading, but no browser layout or real performance score was measured.
- About already acknowledges stock images as illustrative, yet also repeats unverifiable author and editorial experience claims. Existing terms also describe display advertising and carry an old revision date. These need truthful revision.
- No live deployment, browser mobile test, Search Console access, analytics review, backlink audit, full external plagiarism scan, or image-rights verification was performed.

## Policy basis

Use [AdSense Program Policies](https://support.google.com/adsense/answer/48182), [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938) and [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies). Publisher rules cover low-value and replicated inventory and misleading creator representations. Search rules describe scaled production that adds little value, regardless of the production method. A large post count, stock imagery, or automation alone does not establish a violation. The proposed 49-post target is the owner's editorial target, not Google's required minimum.

## Completion checklist

- [x] Inventory every post and record live responses.
- [x] Propose every KEEP, MERGE destination and REMOVE decision.
- [x] Create a per-KEEP worksheet with all four required real-input placeholders.
- [x] Save technical observations, similarity candidates and policy findings.
- [ ] Obtain approval for triage and the implementation plan.
- [ ] Apply approved consolidation, noindex, 301s, navigation/feed/sitemap cleanup.
- [ ] Repair author/About truthfulness, terms footer link, contact and tags.
- [ ] Supply genuine photos, experiences, measurements, costs, time and author details.
- [ ] Verify sources, photo rights, contact delivery, publisher account and affiliate disclosures.
- [ ] Self-host licensed assets and test mobile layout/page speed.
- [ ] Validate the deployed site and reassess all unresolved checklist entries before reapplying.
