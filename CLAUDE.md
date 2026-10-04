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
npm run check-images     # Product image rules; add `-- --network` to fetch every remote image
npm run generate-brand-assets  # Rebuild favicon/icons/logo/og-default.jpg in public/ from the header logo
npm run check-catalogue  # Rules for admin catalogue changes (src/catalogueMerge.js); no network
npm run check-rules      # Probes the LIVE Firestore rules as a signed-out visitor; never writes
npm run check-site       # Headless crawl of a served build (or BASE=https://coollivinguae.com): SEO, images, product states
```

`prerender` needs the built site served on :4173 first (`npx vite preview --port 4173`).
It waits on `domcontentloaded`, not `networkidle0` — pages that read Firestore hold an open
connection, so the network never goes idle and `networkidle0` times out.

**There is no test framework in this project.** No Jest, no Vitest, no test script. Verification
is done through `npm run build`, `npm run lint`, and targeted Node scripts.

### Lint baseline

`npm run lint` reports **11 pre-existing errors** and does not exit clean. This is the accepted
baseline — do not claim lint "passes". Before finishing work, compare the count against 11 and
make sure the number has not grown. Most are unused-variable and empty-block warnings in
`src/App.jsx` and `components/BTUCalculator.jsx`. Destructuring a component as `icon: Icon` in
function parameters trips `no-unused-vars` here; assign it to a capitalised `const` instead.

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
returns a server 404 before React runs. Production (Vercel) gets it from `vercel.json`;
`firebase.json` carries the same rewrite. Replicate it if you move hosts.

In-site links render through `src/components/RouteLink.jsx` — a real `<a href>` that still
navigates client-side on a plain click. Do not go back to `<span onClick>` for navigation:
crawlers do not follow it, so pages were reachable only through the sitemap, and visitors could
not open them in new tabs or reach them by keyboard. Buttons that perform an action (installation
requests, sign-in) stay buttons; per-product installation pages are deliberately not linked.

SEO details that are easy to break:

- `updateSEO()` derives the canonical URL from `window.location.pathname` by default. Do not go
  back to passing a hardcoded path — every page previously declared the homepage as its
  canonical, telling Google all 73 URLs were duplicates.
- It appends the brand to the title only when not already present.
- The 404, admin, installation, and unknown product/category views pass `noIndex`. A SPA cannot
  return a real HTTP 404, so the noindex directive is the only thing preventing soft-404s in
  Search Console. `NotFoundMessage` in `App.jsx` is the shared body for not-found states.
  A product id missing from the list while the catalogue read is in flight renders "Loading…"
  without `noindex` — it may be an admin-added product — then "Product not found" (or "Product
  unavailable" if the read failed), both `noindex`.

### Site URL

`VITE_SITE_URL` sets the public origin used for canonical URLs, Open Graph tags, the sitemap,
and prerendered canonicals. Defaults to `https://coollivinguae.com`. Changing hosts or domains
is one environment variable, not an edit across App.jsx, generate-sitemap.mjs and prerender.mjs.

`index.html` deliberately carries NO static `<link rel="canonical">`. The same file is served
for every route, so a hardcoded canonical declared all 73 URLs to be duplicates of the homepage.
`updateSEO()` inserts the correct per-page canonical; `npm run prerender` bakes it into static
HTML for crawlers that have not run the JavaScript.

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
- `editorialScore` — CoolLivingUAE's own assessment. Never display it as a user-review average;
  the card badge reads "Our score", not a bare star and number.
- `image` — a photo of that product's own brand and type, or `''` (renders a neutral category
  tile via `src/components/ProductImage.jsx`). Never borrow another brand's or category's photo,
  and never add a global fallback photo: one hardcoded Samsung AC image previously appeared on
  every product whose link had died, thermostats and purifiers included. Look at a picture before
  adding it, prefer files under `public/images/products/`, and run `npm run check-images`.

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

`src/App.jsx` is ~2,750 lines and holds most page components. It is large; prefer extracting
into `src/components/` when adding substantial new surface rather than growing it further.

### Catalogue overrides

The admin dashboard saves product changes to one Firestore document, `catalogue/overrides`: a map
of product id → entry. A built-in product's entry holds only the fields that changed, plus an
optional `hidden: true`; an admin-added product's entry is a complete record with `addedAt`.
`src/catalogueMerge.js` owns every rule — validation, merging, the edit operations — and imports
nothing from Firebase, so `npm run check-catalogue` tests it in Node. `src/catalogue.js` only reads
the document (once per page load) and writes it in transactions.

One document rather than one per product keeps reads at one per visit, inside Spark's free 50,000
a day. Photos are links, not uploads: Firebase Storage needs the pay-as-you-go Blaze plan, which
the owner has ruled out. Admin-added products are not in the build-time sitemap; Google reaches
them through the category pages' links.

### Brand assets

The favicon set, app icons, `site.webmanifest`, `logo.png` and `og-default.jpg` in `public/` are
generated by `scripts/generate-brand-assets.mjs` from the header logo's exact markup (Lucide
"wind" icon, Tailwind blue-600 → teal-500, extra-bold "CoolLiving" + "UAE"). Edit the script and
re-run it; do not hand-edit the outputs. The wordmark uses the system UI font, as the live
header does, so raster files take the generating machine's font (committed ones: Windows,
Segoe UI).

### Analytics

GA4 lives in `src/analytics.js`, not in a script tag. Three reasons: GA4 reports one page
view on load and nothing after, so SPA route changes need `trackPageView()` called explicitly
(otherwise the homepage looks like the only page anyone visits); the measurement ID comes from
`VITE_GA4_ID` so the site runs unmeasured rather than shipping a placeholder; and consent is
wired to the React cookie banner.

Consent Mode v2 defaults to denied. With no `VITE_GA4_ID` set, nothing loads at all — no
request to Google, no cookies, `window.gtag` undefined. Verified in a headless browser.

The cookie banner only appears when a measurement ID is configured — with none, the site sets
no optional cookies and there is nothing to ask about. Accepting grants `analytics_storage`
only; the advertising consent signals stay denied because the site runs no ads. The banner,
Privacy Policy and Cookies Policy must keep describing exactly what the site sets: they
previously claimed AdSense advertising cookies that never existed.

`trackEvent('affiliate_click', …)` in `AffiliateLink` is the event that answers the question
the site exists to answer: which reviews send people to a retailer.

### Firebase

`src/firebase.js` exports `db` (Firestore) and `auth`. The config object is committed
deliberately — Google documents the web API key as a public project identifier that ships in
every client bundle. **Access control comes entirely from `firestore.rules`, never from hiding
that config.**

Three collections:

- `installationRequests` — public HVAC lead form. Contains names and phone numbers, so it is
  **write-only for the public**; only an admin can read.
- `residentReviews` — public submissions written `approved: false`, published only after admin
  moderation. See `src/reviews.js`, which owns validation, submission, and bounded reads.
- `catalogue/overrides` — one document holding every product change made in the admin dashboard
  (see "Catalogue overrides"). Readable by anyone, writable only by an allowlisted admin.

Admin identity is a **UID allowlist** in `firestore.rules` (`adminUids()`). Checking
`request.auth != null` is NOT sufficient: enabling the Email/Password provider makes
`createUserWithEmailAndPassword()` callable by anyone holding the public config, so a "signed in"
user is a self-registered stranger until proven otherwise.

Auth state is tracked as three values — `checking` / `in` / `out` — because
`onAuthStateChanged` fires asynchronously. Collapsing it to a boolean renders a blank admin page
in the window between a successful sign-in and the listener firing.

Firestore list queries must stay bounded. `fetchApprovedReviews()` caps at 50. The admin leads
query is still unbounded (known issue).

The installation form validates against the same limits `firestore.rules` enforces (name 2–80
characters, phone 6–25) via `LEAD_LIMITS` in `App.jsx`. Change both together, or the rules
reject requests the form accepts.

### Admin access

The only entry point is the `©` character in the site footer (`src/App.jsx`, styled
`cursor-default` so it does not look clickable). It opens the sign-in modal.

The dashboard's product editor saves to `catalogue/overrides` (see "Catalogue overrides"), and
changes are live immediately. The product tabs stay locked until the overrides have loaded: a form
opened earlier would show original values, and saving it would discard earlier changes. Delete
hides a built-in product (Restore original brings it back) and permanently removes an added one.

## Deployment state — important context

As of 2026-10-04:

- **Production is Vercel**, auto-deploying from GitHub `main` (project `coolliving-uae`; there is
  no local `.vercel` link and the Vercel CLI is not installed). Pushing to `main` deploys.
- **`coollivinguae.com` is live.** Registered at Porkbun, DNS on Porkbun's nameservers: apex
  `A 216.198.79.1`, `www` CNAME to Vercel. `www` and `coolliving-uae.vercel.app` redirect to the
  apex, which must stay the primary because every canonical URL, the sitemap and robots.txt use
  it. Porkbun's MX/SPF records provide email forwarding — keep them.
- Firebase Hosting is configured in `firebase.json` but has never been deployed or used.
- **`firestore.rules` is deployed** and is the source of truth: the owner reads leads in the live
  dashboard, which only these rules allow, and `npm run check-rules` probes the live behaviour.
- The Firebase CLI on the owner's machine is signed in as the owner, so
  `firebase deploy --only firestore:rules` can run from here — only with the owner's explicit
  approval, since it changes production access control. Compile first with `--dry-run`.

If the CLI is ever signed out, `firebase login` needs an interactive browser sign-in that only the
owner can complete.

```bash
firebase deploy --only firestore   # ships firestore.rules AND firestore.indexes.json
```

The `residentReviews` composite index (`approved` ASC + `createdAt` DESC) is required by both the
public reviews query and the moderation query. Without it, Firestore rejects them at runtime.

## Design docs

`docs/superpowers/specs/2026-08-17-affiliate-readiness-design.md` records the affiliate readiness
design: the 11 findings that blocked programme approval, decisions taken, what moved in and out
of scope during implementation, and the routing blocker.
