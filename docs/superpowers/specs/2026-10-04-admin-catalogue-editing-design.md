# CoolLivingUAE — Admin Catalogue Editing Design

**Date:** 2026-10-04
**Status:** Design approved in conversation; written spec awaiting owner review
**Scope:** Make the admin dashboard's product editor save for real, so the owner can add products
and photo links that every visitor sees.

---

## Context

The admin dashboard has had Add, Edit and Delete screens for products since it was built, but they
only change React state. Nothing is stored: a reload discards every change, and visitors never see
any of it. Commit 88ffead labelled the editor "preview only" so it stopped claiming to publish.

The catalogue itself is `src/data/products.js` (60 products), built into the site. Fifty of those
products have no photo, because their previous images were dead links or other brands' photos.

## What the owner asked for

- The admin can **add new products** and **add photos** to products, and visitors see them.
- It must **stay free**. The owner has no budget, and pay-as-you-go billing is ruled out.
- Photos are added as **links** (option B). File uploads would need Firebase Storage, which Google
  offers only on the pay-as-you-go Blaze plan.

**Assumptions confirmed by the owner:**

- Everything done in the admin — new products, photo links, edits to text, price or score, hiding
  a product — is saved and shown to every visitor immediately.
- The 60 built-in products remain the starting point; admin changes sit on top of them.
- Photo links come from manufacturers' websites, not Amazon.

## Success criteria

1. The owner adds a product, or a photo link to an existing product, reloads, and it is still there.
2. A visitor on another device sees the same change without any redeploy.
3. If the database cannot be reached, or the free daily quota is exhausted, the site still shows
   the built-in catalogue and no page breaks.
4. Only the allowlisted admin account can change the catalogue.
5. The site stays within Firebase's free (Spark) quotas at the traffic it can expect.

## Non-goals

- Photo file uploads (needs Blaze — ruled out).
- Editing the AC calculator's unit list (`src/data/calculatorAcs.js`); it stays in code.
- Adding admin-created products to `sitemap.xml`, which is generated at build time. Google finds
  them through the category pages' crawlable links instead.
- Lead notifications, multi-admin roles, edit history.

---

## Approach

All admin changes live in **one Firestore document**, `catalogue/overrides`. Every page load reads
that one document — one read per visit, inside Spark's 50,000 reads a day. One document per product
was rejected: each visit would cost one read per changed product, reaching the quota at roughly
1,000 visits a day once ~50 products have photos. Committing edits to GitHub through a serverless
function was rejected as needing a stored GitHub token and server code to secure.

## Data model

```
catalogue/overrides
  products:  map<productId, entry>
  updatedAt: timestamp            // server time of the last save
```

**Entry for a built-in product** (id exists in `src/data/products.js`): a *partial* record holding
only the fields the admin changed, plus an optional `hidden: true`. Storing only differences means
later code fixes to other fields of that product still reach visitors.

**Entry for an admin-added product** (id not in `products.js`): a *complete* record, plus `addedAt`
(milliseconds since epoch, client clock) used to order added products.

Editable fields, with the limits enforced when saving and again when reading:

| Field | Rule |
|---|---|
| `title` | string, 3–140 characters |
| `brand` | string, 1–60 characters |
| `category` | one of `smart-acs`, `air-purifiers`, `smart-thermostats` |
| `priceBand` | `{ min, max }`, integers 1–1,000,000, `min ≤ max` |
| `editorialScore` | number 0–5 |
| `image` | `''`, an `https://` URL (≤ 600 characters), or a site path starting `/images/` |
| `amazonQuery` | string, 3–120 characters, not a URL |
| `description` | string, 40–4,000 characters |
| `tons` | optional string, ≤ 10 characters |
| `hidden` | built-in entries only: `true` |

The limits must accept every one of the 60 built-in records unchanged; the test suite checks this.

**New product ids** are a slug of the title (lowercase `a-z0-9` and hyphens, ≤ 60 characters) plus
`-` and four random base-36 characters, e.g. `lg-artcool-1-5-ton-split-ac-x7k2`. An id that
collides with a built-in or existing entry is regenerated.

## Components

- **`src/catalogueMerge.js`** — pure functions, no Firebase import, so Node scripts can test them
  (the same reason the catalogue lives in `src/data/`):
  - `sanitizeEntry(entry, { isBuiltIn })` → cleaned fields, or `null` if invalid.
  - `buildCatalogue(builtIns, overrides)` → `{ visible, admin }`. `visible` is the public list:
    built-ins with valid overrides applied, hidden ones removed, then valid added products in
    `addedAt` order. `admin` is every product, including hidden ones, each flagged `isBuiltIn`,
    `isHidden` and `isEdited`. An invalid override is ignored and the built-in shown as-is; an
    invalid added product is left out.
  - `diffAgainstBuiltIn(builtIn, edited)` → only the editable fields that differ.
  - `makeProductId(title, takenIds)`.
- **`src/catalogue.js`** — Firestore I/O, following `src/reviews.js`:
  - `fetchCatalogueOverrides()` → the `products` map, or `{}` when the document does not exist.
    Throws on read failure so the caller can record an error state.
  - `saveEdit(id, record)`, `addProduct(record)`, `hideProduct(id)`, `restoreOriginal(id)`,
    `removeAddedProduct(id)`. Each runs in a transaction — read the document, change one entry,
    write `{ products, updatedAt: serverTimestamp() }` — so two open tabs cannot overwrite each
    other's saves. Each returns the updated `products` map. An edit that leaves a built-in identical
    to its original removes its stored changes rather than saving an empty entry; an existing
    `hidden` flag is kept either way.
  - Errors are rethrown with messages safe to show: permission denied ("This account is not allowed
    to change products"), unavailable ("Could not reach the database — check your connection"),
    quota exhausted ("The free daily limit has been reached — try again tomorrow"), anything else
    ("Could not save. Please try again"). Detail is logged only in development.

## Data flow

**Public site.** `App` renders the built-in catalogue immediately and calls
`fetchCatalogueOverrides()` once on mount. The catalogue status is `loading`, then `ready` or
`error`; the product list is `buildCatalogue(...).visible`, memoised on the overrides. Every page
receives that list, including the About section's product count.

Product page for an id not in the current list:

| Status | Shows | robots |
|---|---|---|
| `loading` | "Loading…" | unchanged (no `noindex` while unknown) |
| `ready` (missing or hidden) | `NotFoundMessage` | `noindex` |
| `error` | "We couldn't load this product right now" | `noindex` |

Built-in products render at once and pick up their overrides when the read completes.

**Admin.** Editing is enabled only once the overrides have loaded. While the status is `loading`,
the products and add tabs show "Loading products…"; on `error` they show the message with a Retry
button that repeats the read. A form opened before the overrides arrived would show original values,
and saving it would silently discard earlier changes.

The products tab lists `buildCatalogue(...).admin`, with "Hidden" and "Edited" labels.
Save, Add, Delete and "Restore original" call the `src/catalogue.js` functions; on success the app
replaces its overrides with the returned map, so public pages update in the same session and the
admin sees "Saved — live on the site now". Delete on a built-in hides it; on an added product it
removes the entry. "Restore original" appears for built-ins with an entry and deletes that entry,
undoing both edits and hiding.

The photo-link field accepts `''`, `https://` URLs and `/images/` paths, shows a live preview,
reports "This link doesn't load an image" when the preview fails, and carries the tip "Use the
manufacturer's photo, not one copied from Amazon". The `SessionOnlyNotice` is removed.

## Security rules (HIGH RISK — changes production access control)

Added to `firestore.rules`; the existing blocks and the default deny are unchanged:

```
match /catalogue/{docId} {
  allow get: if docId == 'overrides';
  allow create, update: if isAdmin()
    && docId == 'overrides'
    && request.resource.data.keys().hasOnly(['products', 'updatedAt'])
    && request.resource.data.products is map
    && request.resource.data.updatedAt == request.time;
}
```

Listing, deleting the document and any other id stay denied by the default rule. Rules cannot
iterate a map, so per-entry validation happens in the client before saving and again in
`buildCatalogue` when reading. Untrusted values never reach HTML unescaped: React escapes text,
links are built by `affiliate.js`, and image URLs are restricted to `https://` and site paths.

## Cost on the free plan

- Reads: one per page load. 50,000 a day free; when the quota is exhausted, Spark returns errors
  instead of billing, and the site falls back to the built-in catalogue.
- Writes: one per admin save, against 20,000 a day free.
- Document size: Firestore's 1 MiB limit allows several hundred products. A save that would exceed
  it fails with an error message.

## Rollout

1. `firebase deploy --only firestore:rules --dry-run` (compiles; changes nothing).
2. Deploy the rules with the CLI already signed in on this machine. Rules go first: until then,
   the app's read is denied and it simply shows the built-in catalogue.
3. Commit and push; Vercel deploys.
4. Verify on the live site, then the owner runs the acceptance test.

## Testing

No test framework exists; verification follows the project's Node-script pattern.

- **`scripts/check-catalogue.mjs`** (`npm run check-catalogue`), written to fail before
  `src/catalogueMerge.js` exists. It asserts that:
  - all 60 built-ins pass `sanitizeEntry`;
  - empty overrides reproduce the built-in catalogue exactly;
  - a partial override changes only its field;
  - a hidden product leaves `visible` but stays in `admin`;
  - invalid overrides (`javascript:` image, `min > max`, URL as `amazonQuery`) are ignored;
  - a valid added product appears in its category in `addedAt` order, an invalid one does not;
  - an orphaned partial entry is ignored;
  - `diffAgainstBuiltIn` returns only changed fields, and nothing for an unchanged record;
  - `makeProductId` yields a valid slug that avoids taken ids.
- `npm run build`; `npm run lint` must stay at or below the baseline of 11.
- After deploying the rules, with REST calls and no credentials:
  - an anonymous `get` of `catalogue/overrides` is permitted;
  - an anonymous write — sent with an `updateTime` precondition that can never match, so it cannot
    apply — returns `PERMISSION_DENIED`;
  - the existing review and lead probes behave as before.
- Headless crawl of all 73 pages on a local build and again on the live site, as for the previous
  release. `/product/<unknown-id>` must show "Loading…" first, then not-found with `noindex`.
- **Owner acceptance test.** Admin saves cannot be exercised without the owner's credentials.
  1. Sign in.
  2. Add a photo link to one product.
  3. Add a test product.
  4. Hide and restore a product.
  5. Confirm each change on a second device.
  6. Delete the test product.

## Risks

- **Rules deploy replaces whatever is live with the repository file.** Read behaviour on 2026-10-04
  matched the repository rules exactly, so the expected change is the new `catalogue` block only.
- **Billing.** If the project were ever moved to the Blaze plan, reads beyond the free quota would
  be billed. On Spark they fail safely. Set a budget alert before any upgrade.
- **Sitemap gaps.** Hidden built-ins stay in the build-time sitemap while their pages are
  `noindex`. Search Console may report "Submitted URL marked noindex" until the next code release
  removes them.
- **First paint.** Edited built-in products first show their original values for the moment
  before the read completes.
