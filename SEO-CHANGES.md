# SEO fixes made to this project

## 1. Blog articles are now static, pre-rendered pages (the big fix)
Previously every article lived at one URL — `insights/blog-details.html` —
with the actual title, meta tags and body text injected by JavaScript
*after* the page loaded, based on a `?slug=...` query string. That meant:

- All 3 posts shared one URL pattern differing only by a query string, which
  search engines generally fold together instead of indexing separately.
- A crawler reading the raw HTML (without running JS) saw an empty loading
  shell, not the article.
- The `<title>`, description and canonical tag in the HTML source were
  generic/identical for every post.

**Fix:** each post now has its own real file with unique, baked-in SEO tags
and full content in the raw HTML:

- `insights/positive-safety-culture-digital-sms.html`
- `insights/near-miss-reporting-to-risk-reduction.html`
- `insights/digitizing-incident-reporting-workplace-safety.html`

Each page ships its own `<title>`, meta description, canonical URL, Open
Graph / Twitter tags, and `BlogPosting` + `BreadcrumbList` JSON-LD — all
present on first byte, no JavaScript required. `blog-engine.js` still runs
on top for interactivity (reading progress bar, prev/next, related posts)
but content no longer depends on it.

The old `insights/blog-details.html?slug=...` links still work — that file
is now a small `noindex` redirect shim that forwards to the correct new
article, so nothing that already links to the old URL breaks.

### Regenerating article pages
Article content lives in `assets/js/blogs-data.js`. After editing it
(or adding a new post), rebuild the static pages with:

```
node scripts/build-blog-pages.js
```

This regenerates every file in `insights/` from the data file. Also add any
new post's URL to `sitemap.xml`.

## 2. Sitemap
`sitemap.xml` now lists the clean article URLs (no query strings) with a
`lastmod` matching each post's actual publish date.

## 3. Homepage blog cards rendered statically
The 3 article cards on the homepage `#insights` section are now present
directly in `index.html`'s HTML (previously injected by JS only), so the
links to each article are crawlable immediately. `blog-engine.js` still
re-renders them on load for consistency if `blogs-data.js` changes.

## 4. Image dimensions for layout stability
Added explicit `width`/`height` attributes to images that were missing
them (logo, dashboard mockups, KPI chart, partner logos) so browsers can
reserve layout space before the image loads, reducing Cumulative Layout
Shift — a Core Web Vitals / page-experience ranking signal.

## 5. Meta title tuning
Blog `<title>` tags were previously the full (80–98 character) headline
plus a suffix, well past the ~60 character point where Google typically
truncates search-result titles. Each post now has a shorter, distinct
`<title>` (~60–65 chars) while the on-page `<h1>` keeps the full headline.

## 6. Apple touch icon
Switched `apple-touch-icon` / 192px icon references from `logo.webp` to
the existing `favicon-192.webp`, with modern WebP icon support across platforms.

## What was already in good shape
Title/meta description/canonical/robots tags, Open Graph and Twitter Card
tags, `Organization` + `SoftwareApplication` + `FAQPage` JSON-LD, a single
`<h1>` per page, descriptive image `alt` text, `robots.txt`, and the web
manifest were already correctly implemented on the homepage and 404 page
before these changes — that part of the "SEO fix" was solid and untouched.
