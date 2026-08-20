# CoolLivingUAE — Affiliate Readiness Design

**Date:** 2026-08-17
**Status:** Approved for planning
**Scope:** Prepare the site to apply for Amazon.ae Associates and Noon affiliate programmes.

---

## Context

CoolLivingUAE is a UAE-focused review site for air conditioners, air purifiers, and smart
thermostats. Its intended revenue model is affiliate commission on Amazon.ae and Noon.ae,
plus AdSense.

**Today the site earns nothing.** No affiliate tracking tag exists anywhere in the codebase
(`grep "tag=" src/App.jsx` returns zero matches across all 60 products and all 21 calculator
models). Every outbound click sends unattributed traffic to Amazon.

The owner has not yet applied to any affiliate programme. The goal of this work is therefore
**passing Amazon's site review**, not conversion optimisation. That reorders priorities: content
credibility and policy compliance matter more than click-through rate, because a rejected
application makes conversion moot.

### Findings that drive this design

| # | Finding | Location | Consequence |
|---|---|---|---|
| 1 | No tracking tag anywhere | whole codebase | Zero revenue, even from existing traffic |
| 2 | Commercial CTAs are `<button onClick={window.open}>`, not links | `src/App.jsx:610`, `:991` | Popup blockers eat clicks; middle-click fails; Amazon's Operating Agreement bars obscured links; no `rel` possible |
| 3 | `ac-1` (LG, "Our #1 Pick") has no `affiliateLink` field | `src/App.jsx:62` | The most prominent CTA on the site opens `undefined` |
| 4 | No `rel="sponsored nofollow"` on any outbound link | `src/App.jsx:1624`, `:1637`, `:1658`, `:1659` | Google requires `sponsored` on paid links; undisclosed paid links risk manual action |
| 5 | 60 descriptions assert first-hand testing that did not occur | `src/App.jsx:56-495` | Amazon Operating Agreement bars misleading statements; UAE Federal Law No. 15 of 2020 bars misleading advertising |
| 6 | 10 fabricated named testimonials, same 2 shown on every product page | `src/App.jsx:20`, rendered `:1002` | FTC 16 CFR Part 465 (effective Oct 2024) prohibits fake consumer reviews |
| 7 | "10,000+ Residents Helped Monthly" | `src/App.jsx:2418` | Unverifiable traffic claim |
| 8 | Hardcoded AED prices displayed as current fact | all 60 products + 21 calculator models | Amazon permits displaying its prices only via Product Advertising API with timestamp |
| 9 | `reviewsCount` (312, 287, 421…) invented; stored and editable in admin but **never rendered publicly** | `src/App.jsx:63`, admin `:2356` | Not a live violation, but the admin form actively invites inventing it ("e.g. 247") and it becomes one the moment anything renders it |
| 10 | Sitemap emits 15 URLs per category; 20 products exist per category | `scripts/generate-sitemap.mjs:38-56` | 15 product pages invisible to Google |
| 11 | Links target search queries containing fragile model numbers | e.g. `AR24BSFCAWKN` | Zero-result pages read as a broken site to a reviewer |

### Decisions taken

- **Content:** rewrite first-person testing claims into honest research-based framing; keep all technical substance.
- **Prices:** replace exact figures with bands. No PA-API (it requires an approved account with 3 qualifying sales — unavailable pre-approval).
- **Links:** keep search-based URLs, but broaden queries so they always return results. Upgrade to direct ASIN links after approval.
- **Architecture:** central affiliate module + shared link component + product data extracted from `App.jsx`.
- **Reviews page:** convert to a genuine moderated submission form backed by Firestore.
- **Staging:** infrastructure first, content rewrite second.

### Non-goals

Conversion-rate optimisation, PA-API integration, AdSense activation, and direct ASIN links are
all explicitly deferred until after programme approval.

---

## Prerequisite (outside this codebase)

Amazon requires a live, publicly reachable site to review. This repo has no deploy
configuration (`vercel.json`, `netlify.toml`, `firebase.json` all absent) and a GitHub remote
only. **`coollivinguae.com` must be deployed and serving before applying.** The code work does
not depend on this, but the application cannot proceed without it.

---

## Architecture

```
src/
  affiliate.js              ← tag injection, URL construction, rel policy
  components/
    AffiliateLink.jsx       ← <a rel="sponsored nofollow"> + consent-gated tracking
    AffiliateDisclosure.jsx ← compact in-proximity disclosure banner
  data/
    products.js             ← 60 products (description, priceBand, amazonQuery)
    calculatorAcs.js        ← 21 calculator models
  App.jsx                   ← UI only (~2,050 lines, down from 2,514)
```

### 1. `src/affiliate.js`

Single source of truth for every outbound commercial link.

```js
// Tags come from environment, never hardcoded.
const AMAZON_AE_TAG = import.meta.env.VITE_AMAZON_AE_TAG;
const NOON_TAG      = import.meta.env.VITE_NOON_TAG;

buildAmazonUrl({ query, asin })  // /dp/{asin}?tag=…  when asin present
                                 // /s?k={encoded}&tag=…  otherwise
buildNoonUrl({ query })          // tagged Noon search URL
```

**Behaviour contract:**

- Tags are read from env vars. When Amazon approves the account, wiring the real ID is a single
  `.env` line — not 60 source edits.
- **When no tag is set (the state today), URLs build untagged and still work.** The site must not
  break pre-approval. A `import.meta.env.DEV`-guarded warning fires once so the omission is
  visible in development; nothing is emitted in production builds.
- Empty, whitespace-only, or non-string `query` returns `null` rather than a malformed URL.
- Query values are passed through `encodeURIComponent`. Callers supply plain search terms, never
  pre-encoded strings or full URLs.
- `.env.example` documents both variables. `.env` stays gitignored.

### 2. `src/components/AffiliateLink.jsx`

Replaces every `window.open()` call with a real anchor:

```jsx
<a href={url} target="_blank" rel="sponsored nofollow noopener noreferrer" …>
```

- `sponsored` is what Google requires for commercial links; `nofollow` is the accepted fallback;
  `noopener noreferrer` closes the reverse-tabnabbing hole that `target="_blank"` opens.
- Middle-click, ⌘-click, and open-in-new-tab begin working. Popup blockers stop suppressing clicks.
- If `buildAmazonUrl` returned `null`, renders a non-interactive disabled state — never a dead link.
- Click tracking fires to `window.gtag` **only when cookie consent was granted**, reusing the
  existing consent state at `src/App.jsx:2433`. No tracking without consent.
- Accepts `className` so existing button styling is preserved exactly; this is not a visual change.

**Call sites to convert:** `ProductCard:610`, `ProductReviewPage:991`, and calculator links at
`:1624`, `:1637`, `:1658`, `:1659`.

### 3. `src/components/AffiliateDisclosure.jsx`

Amazon requires the statement *"As an Amazon Associate I earn from qualifying purchases"* to be
displayed clearly and **in proximity to the links themselves**. A separate disclosure page does
not satisfy this on its own.

Renders a compact notice above the CTA on product review pages, at the top of category listings,
and above calculator results.

The existing full disclosure page (`src/App.jsx:1211`) must also be corrected: it currently
claims active Noon, AdSense, and "Direct Brand Partnerships" relationships that do not exist.
Claiming partnerships you do not have is itself a misrepresentation.

---

## Content remediation

### Product descriptions (60)

Convert first-person test claims to research-based framing. **All technical substance stays** —
T3 ratings, dB measurements, coil coatings, warranty terms, service-network detail, DEWA guidance.
Only unearned first-person authority is removed.

| Before | After |
|---|---|
| "In our 90-day DEWA monitoring study…" | "LG rates the DualCool to 52°C ambient; owner reports on Amazon.ae consistently cite…" |
| "we surveyed 40 Dubai HVAC engineers, O-General was named by 31" | "O-General has a long-standing reputation among UAE HVAC installers…" |
| "our 18-month tracking study across 12 Carrier installations" | "Carrier's scroll-compressor design is rated for longer service life than the rotary compressors typical at this price point" |
| "a 2024 University of Sharjah study confirmed 91.3%" | removed unless a citable source is found |

### Ratings and review counts

- `rating` is relabelled **"CoolLivingUAE Editorial Score"** everywhere it appears. As a clearly
  attributed editorial opinion this is legitimate; as an unattributed star badge it reads as
  aggregated user data, which it is not.
- `reviewsCount` is not currently rendered anywhere public, so nothing needs removing from the
  UI. The field is dropped from the product data and from both admin forms (`src/App.jsx:2281`,
  `:2356`), whose "e.g. 247" placeholder invites fabricating review volume for future products.

### Homepage claim

"10,000+ Residents Helped Monthly" (`src/App.jsx:2418`) is replaced with a factual, defensible
site statistic (e.g. "60 products reviewed across 3 categories").

### Reviews page → real moderated submissions

The 10 fabricated testimonials (`src/App.jsx:20`) are deleted. `ReviewsPage` becomes a genuine
"Share your experience" form writing to a Firestore `userReviews` collection, reusing the
`addDoc` pattern already established at `src/App.jsx:798`.

**Moderation and safety requirements — these are mandatory, not optional:**

- Documents are written with `approved: false`. **Only `approved: true` documents are ever read
  publicly.** Firestore security rules must enforce this, not just client code.
- The admin dashboard gains a moderation tab to approve or reject pending submissions, following
  the existing leads-tab pattern (`src/App.jsx:1873`).
- All submitted fields are validated and length-capped client-side **and** in Firestore rules.
  Client-side validation alone is not a security control.
- Public write access invites spam. Rules must cap document size and reject unexpected fields.
- The public page displays name and emirate only. No email, no phone number.
- The product page block currently rendering `userReviews.slice(0, 2)` (`src/App.jsx:1002`) is
  removed; it showed the same two fabricated reviews on all 60 products.

Until real submissions accumulate the page renders an honest empty state.

---

## Price bands

`price: 1950` becomes `priceBand: { min: 1800, max: 2200 }`, rendered as "AED 1,800 – 2,200"
alongside a "verify current price on Amazon.ae" note.

The calculator's 21 models (`src/App.jsx:1407`) get the same treatment. Its budget-sorting logic
currently sorts on `priceAED` and must switch to sorting on band midpoint — this is a real
behaviour change to verify, not a pure data swap.

---

## Link quality

- Add the missing `ac-1` affiliate query.
- Broaden all queries to drop fragile model numbers:
  `AR24BSFCAWKN` → `Samsung WindFree 2 ton inverter split AC UAE`.
- Drop the brittle `&rh=n%3A11557803031` category filter in the calculator data.
- Product data stores **search terms only**, never full URLs. URLs are constructed at render time
  by `affiliate.js`, which is what makes a missing tag structurally impossible.

---

## Crawlability

`scripts/generate-sitemap.mjs` hardcodes `{ length: 15 }` per category (lines 38-56) while 20
products exist in each — 15 pages are absent from the sitemap.

Fix by importing the actual product data and deriving URLs from it, so the sitemap cannot drift
out of sync with the catalogue again. This is why `products.js` extraction pays for itself
immediately: a Node script cannot import product data out of a JSX component file.

---

## Scope changes during implementation

**Pulled into scope — security.** Items 1 and 2 below were originally listed as out of scope,
but the approved moderation model requires that "only `approved: true` documents are readable
publicly" be enforced by security rules. Rules that distinguish an administrator from the public
require real authentication, so the moderation feature could not be built safely without it.
Both were therefore implemented:

- Firebase Authentication replaces the client-side access key. `firestore.rules` grants lead
  access and moderation rights only to a signed-in user.
- `firestore.rules` was written from scratch with field allow-lists, size caps, and default-deny.

**Also fixed in passing:** calculator images that hotlinked unrelated retail sites (several
showed the wrong brand or capacity), and a pre-existing `ReferenceError` — `icon: Phone || Mail`
referenced an unimported identifier and crashed the admin leads detail view.

## Still out of scope

1. Unbounded lead query in the leads tab (no `limit`).
2. `console.error` and raw `alert()` in the installation lead handler.
3. Product images in `src/data/products.js` still hotlink Amazon's CDN. Lower risk than the
   calculator images that were replaced, but not under our control.

## BLOCKER discovered during implementation: the app has no URL routing

`src/App.jsx:2406` — `navigate()` only calls `setRoute()`. Nothing reads `window.location`,
nothing calls `history.pushState`, and there is no `popstate` listener. `react-router-dom` is
installed but never imported.

Every page therefore lives at `/`. The consequences for this project are direct:

- The sitemap now advertises 73 URLs, **none of which the application can serve.** Visiting
  `/product/ac-1` either 404s or renders the homepage.
- Googlebot would find 60 product URLs that all render identical homepage content — a textbook
  duplicate-content signal.
- An Amazon reviewer clicking any deep link lands on the wrong page, which reads as a broken site.
- `scripts/prerender.mjs` targets hash routes (`/#/guides`) that the app does not implement
  either, so prerendering currently produces copies of the homepage under different filenames.

Fixing this means adopting real routing (the installed `react-router-dom`, or `history` +
`popstate`), converting every `navigate()` call site, and adding SPA rewrite rules at the host.
It is a project in its own right and was not part of this design, but **the affiliate application
should not be submitted until it is done** — the sitemap and prerendering work assume it.

---

## Staging

**Phase 1 — infrastructure.** `affiliate.js`, `AffiliateLink`, `AffiliateDisclosure`, data
extraction, price bands, link-quality fixes, sitemap fix. Reviewable independently; verifies the
plumbing before any copy is touched.

**Phase 2 — content.** 60 description rewrites, rating relabel, `reviewsCount` removal, homepage
claim, reviews-page conversion with moderation.

---

## Verification

**Phase 1**

- `npm run build` completes clean.
- `npm run lint` reports no new errors.
- `grep -rn "window.open" src/` returns no commercial links.
- `grep -c "amazon.ae" src/data/products.js` returns 0 — all URLs constructed, none stored.
- With `VITE_AMAZON_AE_TAG` set in `.env`, the resolved `href` on a product card, a review page,
  and a calculator row each contain `tag=`.
- With the tag **unset**, links still resolve and the page does not error.
- Inspected anchors carry `rel="sponsored nofollow noopener noreferrer"` and `target="_blank"`.
- `node scripts/generate-sitemap.mjs` emits 60 product URLs (was 45).
- Calculator recommendations remain correctly ordered after the band-midpoint sort change —
  compare output against current behaviour for at least three room sizes.

**Phase 2**

- `grep -rniE "our (test|study|survey)|we (tested|surveyed|measured|tracked)" src/data/products.js`
  returns no unsubstantiated first-person claims.
- No fabricated testimonial text remains anywhere in `src/`.
- Review submission writes `approved: false`; an unapproved document is **not** readable by an
  unauthenticated client (test against deployed Firestore rules, not just the UI).
- Admin moderation tab lists, approves, and rejects submissions.
- Oversized and unexpected-field submissions are rejected by Firestore rules.

**Pre-application checklist**

- Site deployed and publicly reachable at `coollivinguae.com`.
- Disclosure visible in proximity to links on product, category, and calculator pages.
- Disclosure page accurately describes only real, active relationships.
- No zero-result Amazon search links — spot-check all 60.
