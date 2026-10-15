# Search Console impression-drop investigation

Investigation date: October 15, 2026 (Asia/Karachi).

The owner reports roughly 100 daily Google Search Console impressions previously, dropping to zero about three days ago. The exact Search Console property, date filters, affected pages and indexing reports have not been supplied. No account-level traffic or Google-selected canonical data was available during this investigation.

## Findings supported by repository history

1. October 12, commit `4accdfa`: introduced `editorialReady` and added `editorialReady: false` to 26 articles. Publication eligibility, article robots directives and sitemap inclusion use that flag. Ten of these articles had publication dates on or before October 15; the other sixteen were already scheduled for later dates. Comparing the same date cutoff, indexable-by-configuration article counts changed from 133 in `37622bc` to 123 in `4accdfa`.
2. October 14 remediation: added 80 article redirects and 22 removal dispositions, plus additional holds. Current configuration allows 38 published articles into the sitemap. The archived deployment verification records that remediation live on October 14. This later event cannot explain an onset on October 12, but could affect subsequent performance.
3. The current design changes did not alter those publication/indexability flags. Passing build audits established consistency with the configuration, not the correctness of past retirement decisions for actual search performance.

## Ten already-published articles held on October 12

| Original URL | Current local disposition |
| --- | --- |
| `/post/bathroom-organization-ideas-small-spaces/` | Merged |
| `/post/cozy-small-bedroom-ideas/` | Merged |
| `/post/modern-boys-bedroom-ideas/` | Merged |
| `/post/small-apartment-storage-ideas/` | Merged |
| `/post/small-bedroom-storage-ideas/` | Retained, editorial hold |
| `/post/small-entryway-organization-ideas/` | Merged |
| `/post/small-kitchen-organization-ideas/` | Retained, editorial hold |
| `/post/small-laundry-room-organization-ideas/` | Retained, editorial hold |
| `/post/small-space-christmas-decor-ideas/` | Retained, editorial hold |
| `/post/teenage-boy-bedroom-ideas/` | Retained, editorial hold |

## Live HTTP observations

Read-only fetches of the production domain confirmed:

- `/robots.txt`: 200; article crawling is allowed. `/search/` is the only general disallow rule.
- `/sitemap-0.xml`: 200, containing 38 article URLs.
- `/` and `/post/small-boys-bedroom-ideas/`: 200, indexable robots metadata, no X-Robots-Tag header.
- `/post/small-bedroom-storage-ideas/`, `/post/small-kitchen-organization-ideas/`, `/post/small-laundry-room-organization-ideas/` and `/post/teenage-boy-bedroom-ideas/`: 200, `noindex, follow`, no overriding X-Robots-Tag header.
- `/post/halloween-door-decorations/`: 301 to `/post/halloween-door-decor-ideas/`.
- `/post/couple-costume-ideas/`: 200, `noindex, follow`.
- `/post/neutral-bedroom-ideas/`: 200, self-canonical and `noindex, follow`; its November 22 publication date is in the future, so it is not an example of the October 12 hold regression.

These observations rule out a universal article robots block in the samples. They do not prove Google has crawled the current versions, that every URL is healthy, or that there is no manual action or reporting issue.

## Assessment and next evidence

The October 12 indexing change matches the approximate reported onset and is a plausible cause if the affected articles generated most of the prior impressions. The October 14 consolidation is another material traffic risk. Neither can be conclusively attributed to the reported total loss without Search Console's page-level data.

Obtain a Performance export covering the last 28 days (Dates and Pages tabs, with prior/current comparison if available), the exact selected property and search type, plus URL Inspection results for previously performing URLs. Check Page indexing, Manual actions and Security issues. Compare completed days rather than treating an incomplete most-recent day as a confirmed loss.

Match lost-impression URLs to the table above and October 14's `triage.csv`. Review the affected article content and restore indexing or original routes where evidence supports that correction; preserve existing original URLs and self-canonicals. Do not blindly reset all editorial holds, publish future-dated drafts, remove every redirect, or promise a recovery date.

No indexability, article content, redirects or production deployment was changed during this investigation.

References: [Google's traffic-drop investigation guide](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops), [Google's noindex documentation](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
