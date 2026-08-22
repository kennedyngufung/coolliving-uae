# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CoolLivingUAE is a UAE-focused affiliate review site for air conditioners, air purifiers, and
smart thermostats. The business model is: rank in Google for UAE cooling searches → send
visitors to Amazon.ae / Noon.ae via tagged affiliate links → also capture HVAC installation
leads into Firestore.

The owner has **not yet applied** to any affiliate programme. Work is therefore aimed at
passing Amazon's site review, which makes content credibility and policy compliance more
important than conversion optimisation.

## Commands

```bash
npm run dev              # Vite dev server on :5173
npm run build            # Production build to dist/
npm run lint             # ESLint
npm run generate-sitemap # Regenerate public/sitemap.xml + robots.txt from the catalogue
npm run build:prod       # build + generate-sitemap
npm run prerender        # Puppeteer static prerender of all 73 crawlable URLs
```

`prerender` needs the built site served on :4173 first (`npx vite preview --port 4173`).
It waits on `domcontentloaded`, not `networkidle0` — pages that read Firestore hold an open
connection, so the network never goes idle and `networkidle0` times out.

**There is no test framework in this project.** No Jest, no Vitest, no test script. Verification
is done through `npm run build`, `npm run lint`, and targeted Node scripts.

### Lint baseline

`npm run lint` reports **12 pre-existing errors** and does not exit clean. This is the accepted
baseline — do not claim lint "passes". Before finishing work, compare the count against 12 and
make sure the number has not grown. Most are unused-variable and empty-block warnings in
`src/App.jsx` and `components/BTUCalculator.jsx`.

## Architecture

### Routing — read this first

The app does **not** use a router library. `react-router-dom` is a dependency but is never
imported; removing it would be safe. Routing is hand-rolled around a `{ path, params }` state
object, with `src/routes.js` as the single translation layer between that object and real URLs.

- `pathToRoute(pathname)` — URL → `{ path, params }`. Unknown URLs return `{ path: 'not-found' }`.
- `routeToPath(path, params)` — `{ path, params }` → URL.
- `crawlablePaths(products)` — every indexable URL. **Both the sitemap generator and the
  prerender script import this**, so neither can drift from what the app actually serves.

`navigate(path, params)` keeps its original signature — it now also calls `history.pushState`.
A `popstate` listener in `App.jsx` handles back/forward. When adding a route, add it to
`STATIC_ROUTES` or `ID_ROUTES` in `src/routes.js` and to the switch in `renderPage()`.

**Any host must rewrite unknown paths to `/index.html`**, or loading `/product/ac-1` directly
returns a server 404 before React runs. The rewrite is configured in `firebase.json`; replicate
it if you move hosts.

SEO details that are easy to break:

- `updateSEO()` derives the canonical URL from `window.location.pathname` by default. Do not go
  back to passing a hardcoded path — every page previously declared the homepage as its
  canonical, telling Google all 73 URLs were duplicates.
- It appends the brand to the title only when not already present.
- The 404 and admin routes pass `noIndex`. A SPA cannot return a real HTTP 404, so the noindex
  directive is the only thing preventing soft-404s in Search Console.

### The affiliate link layer — the core invariant

`src/affiliate.js` is the single source of truth for every outbound commercial URL.

**Product data stores search TERMS, never finished URLs.** URLs are built at render time with
the tracking tag applied by construction, which is what makes an untagged affiliate link
structurally impossible. The site previously shipped 60 hardcoded URLs with no tag at all and
earned nothing.

When adding a product, follow the field contract documented at the top of `src/data/products.js`:

- `amazonQuery` — search terms only. Broad (brand + capacity + type + "UAE"). Model numbers date
  quickly and produce zero-result pages, which read as a broken site to a programme reviewer.
- `priceBand` — `{ min, max }` in AED. Never an exact price: Amazon's Operating Agreement permits
  displaying its prices only via the Product Advertising API with a timestamp.
- `editorialScore` — CoolLivingUAE's own assessment. Never display it as a user-review average.

All outbound commercial links must render through `src/components/AffiliateLink.jsx`, which
produces a real anchor with `rel="sponsored nofollow noopener noreferrer"`. Never use
`window.open()` for a commercial link — popup blockers discard it, middle-click breaks, and
Amazon's Operating Agreement requires links not be obscured.

`src/components/AffiliateDisclosure.jsx` adapts its wording to whether a tracking tag is actually
configured. Do not make it assert an Amazon Associates relationship that does not yet exist.

### Content rules — these are legal constraints, not style preferences

Product copy previously claimed first-hand testing that never happened, and shipped ten
fabricated named testimonials. Both were removed. When writing or editing product copy:

- State what manufacturers specify, what standards certify, and what we conclude as opinion.
- **Do not assert testing that has not been carried out and documented.**
- Do not invent user reviews, review counts, or traffic figures.

The FTC rule on fake reviews (16 CFR Part 465), Amazon's Operating Agreement, and UAE Federal Law
No. 15 of 2020 on Consumer Protection all bear on this.

### Data flow

- `src/data/products.js` — 60 products (20 per category), flattened and exported with `category`
  stamped on. Also exports `formatPriceBand()` and `priceBandMidpoint()`.
- `src/data/calculatorAcs.js` — 21 units the BTU calculator recommends. Sorted by band midpoint,
  since exact prices no longer exist.
- Data lives in `src/data/` specifically so `scripts/generate-sitemap.mjs` can import it. A Node
  script cannot import data out of a JSX component file — this is why the sitemap previously
  hardcoded a count of 15 per category and silently omitted 15 product pages.

`src/App.jsx` is ~2,100 lines and holds all page components. It is large; prefer extracting when
adding substantial new surface rather than growing it further.

### Analytics

GA4 lives in `src/analytics.js`, not in a script tag. Three reasons: GA4 reports one page
view on load and nothing after, so SPA route changes need `trackPageView()` called explicitly
(otherwise the homepage looks like the only page anyone visits); the measurement ID comes from
`VITE_GA4_ID` so the site runs unmeasured rather than shipping a placeholder; and consent is
wired to the React cookie banner.

Consent Mode v2 defaults to denied. With no `VITE_GA4_ID` set, nothing loads at all — no
request to Google, no cookies, `window.gtag` undefined. Verified in a headless browser.

`trackEvent('affiliate_click', …)` in `AffiliateLink` is the event that answers the question
the site exists to answer: which reviews send people to a retailer.

### Firebase

`src/firebase.js` exports `db` (Firestore) and `auth`. The config object is committed
deliberately — Google documents the web API key as a public project identifier that ships in
every client bundle. **Access control comes entirely from `firestore.rules`, never from hiding
that config.**

Two collections:

- `installationRequests` — public HVAC lead form. Contains names and phone numbers, so it is
  **write-only for the public**; only an admin can read.
- `residentReviews` — public submissions written `approved: false`, published only after admin
  moderation. See `src/reviews.js`, which owns validation, submission, and bounded reads.

Admin identity is a **UID allowlist** in `firestore.rules` (`adminUids()`). Checking
`request.auth != null` is NOT sufficient: enabling the Email/Password provider makes
`createUserWithEmailAndPassword()` callable by anyone holding the public config, so a "signed in"
user is a self-registered stranger until proven otherwise.

Auth state is tracked as three values — `checking` / `in` / `out` — because
`onAuthStateChanged` fires asynchronously. Collapsing it to a boolean renders a blank admin page
in the window between a successful sign-in and the listener firing.

Firestore list queries must stay bounded. `fetchApprovedReviews()` caps at 50. The admin leads
query is still unbounded (known issue).

### Admin access

The only entry point is the `©` character in the site footer (`src/App.jsx`, styled
`cursor-default` so it does not look clickable). It opens the sign-in modal.

## Deployment state — important context

As of the last session, **nothing has been deployed**:

- Commits exist locally and may not be pushed to GitHub (`origin/main`).
- **`firestore.rules` has never been deployed.** The file is inert until pushed to Firebase.
  Until then the project's live rules are whatever is configured in the console.
- Firebase Hosting IS now configured in `firebase.json` (serves `dist/`, rewrites all unknown
  paths to /index.html, long-cache on hashed assets). Deploy with
  `firebase deploy --only hosting`. Free on the Spark plan.
- Whether `coollivinguae.com` currently serves anything, and where its DNS points, is unconfirmed.

Deploying rules requires `firebase login`, which needs an interactive browser sign-in that Claude
Code cannot complete. That step must be run by the user.

```bash
firebase deploy --only firestore   # ships firestore.rules AND firestore.indexes.json
```

The `residentReviews` composite index (`approved` ASC + `createdAt` DESC) is required by both the
public reviews query and the moderation query. Without it, Firestore rejects them at runtime.

## Design docs

`docs/superpowers/specs/2026-08-17-affiliate-readiness-design.md` records the affiliate readiness
design: the 11 findings that blocked programme approval, decisions taken, what moved in and out
of scope during implementation, and the routing blocker.
