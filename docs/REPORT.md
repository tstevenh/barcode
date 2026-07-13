# SEO Overhaul and De-Brand Report

## Summary

- Renamed the site, UI, footer, generated content, API docs, and sample data to `Barcode Mint`.
- Changed the canonical production domain to `https://barcodemint.com` and made the i18n checker derive it from `data/seo-content.js`.
- Rebuilt all generated pages from source: 636 symbology landing pages, 6 hub pages, 6 homepages, `sitemap.xml`, and `robots.txt`.
- Added generator-level SEO enforcement for unique keyword-first titles, unique meta descriptions, one H1 per page, complete hreflang clusters, OG/Twitter tags, sitemap `lastmod`, and JSON-LD.
- Expanded JSON-LD on landing pages with `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `SoftwareApplication`, `HowTo`, and `FAQPage` where page content supports it.
- Updated internal related links to use descriptive localized generator anchor text.

## Examples

| Page | Before | After |
| --- | --- | --- |
| `/qr-code` | `QR Code Generator - Free, No Login \| [previous brand]` | `qr code generator \| Barcode Mint` |
| `/code-128` | `Code 128 Barcode Generator \| [previous brand]` | `code 128 barcode generator \| Barcode Mint` |
| `/ja/ean-13` | `JANコード 作成 \| [previous brand]` | `JANコード 作成 EAN-13 \| Barcode Mint` |

## Verification

- `node scripts/build-pages.mjs`: built 636 landing pages + 6 hubs + 6 homepages; pages under 800 words: `0/636`.
- `node scripts/check-i18n.mjs`: all locales passed with `0` leaks and `0` thin pages.
- Sitemap URL count: `649`.
- Required spot checks covered `/qr-code`, `/code-128`, `/de/pdf417`, `/ja/ean-13`, `/barcodes`, `/pl/barcodes`, and all locale homepages.
- JSON-LD parsed successfully in sampled landing, hub, and homepage outputs.

## Domain Decision

The new configured domain is `https://barcodemint.com`. Prior-name and prior-domain references are not intentionally retained.
