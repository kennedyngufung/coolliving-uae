# Admin Catalogue Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin dashboard save product edits, new products and photo links to Firestore so every visitor sees them, and let the admin delete installation leads.

**Architecture:** One Firestore document, `catalogue/overrides`, holds every admin change as a map of product id → entry. `src/catalogueMerge.js` is pure — validation, merging over `src/data/products.js`, and the edit operations — so Node tests it; `src/catalogue.js` reads the document once per page load and writes it in transactions. `App` renders the built-in catalogue immediately and applies the overrides when the read completes; the dashboard edits through the same state.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Firebase JS SDK 12 (Firestore, Auth), Firebase CLI 15, Node 24 scripts, Puppeteer 22.

**Spec:** `docs/superpowers/specs/2026-10-04-admin-catalogue-editing-design.md`

## Global Constraints

- Free (Spark) plan only: one Firestore read of `catalogue/overrides` per page load; no Firebase Storage or other Blaze-only feature.
- Field limits, exactly: `title` 3–140 chars; `brand` 1–60; `category` ∈ `smart-acs`, `air-purifiers`, `smart-thermostats`; `priceBand` `{min, max}` integers 1–1,000,000 with `min ≤ max`; `editorialScore` number 0–5; `image` `''`, an `https://` URL ≤ 600 chars, or a site path starting `/images/`; `amazonQuery` 3–120 chars and not a URL; `description` 40–4,000; `tons` optional ≤ 10.
- New product ids: slug of the title (`a-z0-9` and hyphens, ≤ 60 chars) + `-` + 4 base-36 characters.
- The `catalogue` rules block is exactly the spec's; existing rule blocks and the default deny stay unchanged.
- `npm run lint` must never exceed the baseline of 11 errors (expected: 10 after Task 3, 9 after Task 4).
- Production code never logs except behind `import.meta.env.DEV`; no `alert()`; errors are shown inline. No personal data in logs.
- No copy may claim testing that was not done (CLAUDE.md content rules).
- Commit at the end of each task with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push only in Task 5.
- Deploying `firestore.rules` changes production access control (HIGH RISK): dry-run first, deploy only as written in Task 2.

## Review Focus

1. Firestore unreachable or over quota while a visitor opens an admin-added product → "Product unavailable" with `noindex`, never a blank page or a permanent "Loading…" (test: Task 3, `check-site` blocked-Firestore case).
2. Firestore unreachable on a built-in product page → the built-in review still renders (test: Task 3, `check-site` blocked-Firestore case).
3. Admin types an `http://` photo link, a link in the search-terms box, a price with a comma, or a minimum above the maximum → a specific inline error and nothing saved (test: Task 1, `validateProductForm` cases).
4. One dashboard tab saves an edit after another tab hid the same product → the product stays hidden (test: Task 1, `applyEdit` stale-tab case).
5. The admin's session expired or was revoked when saving → "This account is not allowed to change products…" rather than a generic failure (test: Task 1, `describeSaveError` case).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/catalogueMerge.js` (create) | Pure rules: field validation, merging overrides over built-ins, edit operations, error messages. No Firebase import. |
| `src/catalogue.js` (create) | Firestore I/O for `catalogue/overrides`: one read, transactional writes. |
| `src/components/ImageLinkField.jsx` (create) | Photo-link input for both admin product forms: tip, live preview, "doesn't load an image" warning. |
| `scripts/check-catalogue.mjs` (create) | Node assertions for `src/catalogueMerge.js`. |
| `scripts/check-rules.mjs` (create) | Signed-out probes of the live Firestore rules; never writes. |
| `scripts/check-site.mjs` (create) | Headless crawl of a served build or the live site, plus product-page loading/missing/failed states. |
| `firestore.rules` (modify) | Add the `catalogue` block. |
| `src/App.jsx` (modify) | App catalogue state and actions; product page states; About count; dashboard product editor; leads. |
| `package.json` (modify) | `check-catalogue`, `check-rules`, `check-site` scripts. |
| `CLAUDE.md` (modify) | Catalogue overrides, rules deployment, new scripts, leads. |

---

### Task 1: Catalogue rules module

**Files:**
- Create: `src/catalogueMerge.js`
- Create: `scripts/check-catalogue.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `products` from `src/data/products.js` (60 records: `id, brand, title, editorialScore, priceBand, image, amazonQuery, description, category`).
- Produces (all named exports of `src/catalogueMerge.js`):
  - `CATEGORIES: string[]`, `EDITABLE_FIELDS: string[]`, `FIELD_LIMITS: object`
  - `class CatalogueError extends Error` — message safe to show the admin
  - `isValidProductId(id: string): boolean`
  - `sanitizeEntry(entry: object, { isBuiltIn: boolean }): object | null`
  - `buildCatalogue(builtIns: object[], overrides: object): { visible: object[], admin: object[] }` — each record gains `isBuiltIn`, `isHidden`, `isEdited` (added products also `addedAt`)
  - `diffAgainstBuiltIn(builtIn: object, edited: object): object`
  - `slugify(text: string): string`, `makeProductId(title: string, takenIds: Set<string>, random?: () => number): string`
  - `validateProductForm(form: object): { ok: boolean, record: object, errors: object, firstError: string }`
  - `applyEdit(products, builtInsById: Map, id, record): object`
  - `applyAdd(products, builtInsById, record, { now?, random? }): { products: object, id: string }`
  - `applyHide(products, builtInsById, id): object`
  - `applyRestore(products, builtInsById, id): object`
  - `applyRemoveAdded(products, builtInsById, id): object`
  - `describeSaveError(error): string`

- [ ] **Step 1: Write the failing test script**

Create `scripts/check-catalogue.mjs`:

```js
/**
 * CoolLivingUAE — Catalogue overrides checks
 * ---------------------------------------------------------------------------
 * Run: npm run check-catalogue
 *
 * Exercises src/catalogueMerge.js, the pure rules behind the admin product
 * editor: validation, merging overrides over the built-in catalogue, and the
 * changes each dashboard action saves. The project has no test framework, so
 * this follows scripts/check-images.mjs: plain assertions, non-zero exit on
 * any failure.
 * ---------------------------------------------------------------------------
 */

import assert from 'node:assert/strict';
import { products } from '../src/data/products.js';
import {
  buildCatalogue, sanitizeEntry, diffAgainstBuiltIn, makeProductId, isValidProductId,
  validateProductForm, applyEdit, applyAdd, applyHide, applyRestore, applyRemoveAdded,
  describeSaveError, CatalogueError,
} from '../src/catalogueMerge.js';

const builtInsById = new Map(products.map((p) => [p.id, p]));
const ac1 = builtInsById.get('ac-1');
const COMPARED_FIELDS = ['title', 'brand', 'category', 'priceBand', 'editorialScore', 'image', 'amazonQuery', 'description'];

const VALID_NEW = {
  title: 'LG ArtCool 1.5 Ton T3 Inverter Split AC',
  brand: 'LG',
  category: 'smart-acs',
  priceBand: { min: 2300, max: 2800 },
  editorialScore: 4.6,
  image: 'https://www.lg.com/ae/images/artcool.jpg',
  amazonQuery: 'LG ArtCool 1.5 ton inverter split AC UAE',
  description: 'A description long enough to pass validation, written only for this test script.',
  tons: '1.5',
  addedAt: 1000,
};

const FORM = {
  title: 'LG ArtCool', brand: 'LG', category: 'smart-acs', priceMin: '2300', priceMax: '2800',
  editorialScore: '4.6', tons: '', image: '', amazonQuery: 'LG ArtCool 1.5 ton UAE',
  description: VALID_NEW.description,
};

let passed = 0;
const failures = [];
function check(name, fn) {
  try { fn(); passed += 1; } catch (error) { failures.push(`${name}\n      ${String(error.message).split('\n')[0]}`); }
}

check('all 60 built-ins pass as partial entries, unchanged', () => {
  assert.equal(products.length, 60);
  for (const p of products) {
    const clean = sanitizeEntry(p, { isBuiltIn: true });
    assert.ok(clean, `${p.id} rejected`);
    for (const field of COMPARED_FIELDS) assert.deepEqual(clean[field], p[field], `${p.id}.${field} altered`);
  }
});

check('all 60 built-ins also pass as complete records, so the limits fit real data', () => {
  for (const p of products) assert.ok(sanitizeEntry({ ...p, addedAt: 1 }, { isBuiltIn: false }), `${p.id} rejected`);
});

check('missing or malformed overrides reproduce the built-in catalogue', () => {
  for (const overrides of [{}, undefined, null, 'garbage', []]) {
    const { visible, admin } = buildCatalogue(products, overrides);
    assert.equal(visible.length, 60);
    assert.equal(admin.length, 60);
    visible.forEach((p, i) => {
      for (const field of Object.keys(products[i])) assert.deepEqual(p[field], products[i][field]);
      assert.equal(p.isEdited, false);
      assert.equal(p.isHidden, false);
    });
  }
});

check('a partial override changes only its own field', () => {
  const { visible, admin } = buildCatalogue(products, { 'ac-1': { image: 'https://example.com/lg.jpg' } });
  const p = visible.find((x) => x.id === 'ac-1');
  assert.equal(p.image, 'https://example.com/lg.jpg');
  assert.equal(p.title, ac1.title);
  assert.equal(p.description, ac1.description);
  assert.equal(admin.find((x) => x.id === 'ac-1').isEdited, true);
});

check('a hidden built-in leaves the public list but stays in the admin list', () => {
  const { visible, admin } = buildCatalogue(products, { 'thermo-4': { hidden: true } });
  assert.equal(visible.length, 59);
  assert.ok(!visible.some((p) => p.id === 'thermo-4'));
  const row = admin.find((p) => p.id === 'thermo-4');
  assert.equal(row.isHidden, true);
  assert.equal(row.isEdited, false);
});

check('invalid overrides are ignored and the built-in shown as-is', () => {
  const bad = {
    'ac-1': { image: 'javascript:alert(1)' },
    'ac-2': { priceBand: { min: 3000, max: 2000 } },
    'ac-3': { amazonQuery: 'https://www.amazon.ae/dp/B0TEST1234' },
    'ac-4': { image: 'http://insecure.example.com/x.jpg' },
    'ac-5': { hidden: true, title: 'x' }, // invalid title voids the whole entry, hide included
  };
  const { visible } = buildCatalogue(products, bad);
  assert.equal(visible.length, 60);
  for (const id of Object.keys(bad)) {
    const shown = visible.find((p) => p.id === id);
    for (const field of COMPARED_FIELDS) assert.deepEqual(shown[field], builtInsById.get(id)[field], `${id}.${field}`);
  }
});

check('valid added products follow the built-ins of their category, in addedAt order', () => {
  const later = { ...VALID_NEW, title: 'Second added AC for ordering', addedAt: 2000 };
  const { visible } = buildCatalogue(products, { 'zz-second-ac-aaaa': later, 'lg-artcool-1-5-ton-b2c3': VALID_NEW });
  const acs = visible.filter((p) => p.category === 'smart-acs');
  assert.equal(acs.length, 22);
  assert.equal(acs[20].id, 'lg-artcool-1-5-ton-b2c3');
  assert.equal(acs[21].id, 'zz-second-ac-aaaa');
  assert.equal(acs[20].isBuiltIn, false);
});

check('incomplete, invalid or badly keyed added products are left out', () => {
  const { visible, admin } = buildCatalogue(products, {
    'missing-fields-aaaa': { title: 'Only a title' },
    'Bad Id With Spaces': VALID_NEW,
    'no-timestamp-aaaa': { ...VALID_NEW, addedAt: undefined },
    'bad-score-aaaa': { ...VALID_NEW, editorialScore: 9 },
  });
  assert.equal(visible.length, 60);
  assert.equal(admin.length, 60);
});

check('diffAgainstBuiltIn returns only the fields that changed', () => {
  assert.deepEqual(diffAgainstBuiltIn(ac1, { ...ac1 }), {});
  assert.deepEqual(diffAgainstBuiltIn(ac1, { ...ac1, priceBand: { ...ac1.priceBand }, tons: '' }), {});
  assert.deepEqual(diffAgainstBuiltIn(ac1, { ...ac1, image: 'https://example.com/a.jpg' }), { image: 'https://example.com/a.jpg' });
  assert.deepEqual(diffAgainstBuiltIn(ac1, { ...ac1, priceBand: { min: 1, max: 2 } }), { priceBand: { min: 1, max: 2 } });
});

check('makeProductId builds a valid slug and avoids taken ids', () => {
  const sequence = [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5];
  let i = 0;
  const id = makeProductId('LG ArtCool 1.5 Ton Split AC!', new Set(['lg-artcool-1-5-ton-split-ac-0000']), () => sequence[i++]);
  assert.equal(id, 'lg-artcool-1-5-ton-split-ac-iiii');
  assert.ok(isValidProductId(id));
  const long = makeProductId('x'.repeat(200), new Set(), () => 0);
  assert.ok(long.length <= 65 && isValidProductId(long), long);
  assert.equal(makeProductId('!!!', new Set(), () => 0), 'product-0000');
});

check('validateProductForm accepts a complete form and converts its values', () => {
  const result = validateProductForm({ ...FORM, title: ' LG ArtCool ', tons: '1.5', image: ' https://www.lg.com/ae/images/artcool.jpg ' });
  assert.equal(result.ok, true, result.firstError);
  assert.deepEqual(result.record.priceBand, { min: 2300, max: 2800 });
  assert.equal(result.record.editorialScore, 4.6);
  assert.equal(result.record.title, 'LG ArtCool');
  assert.equal(result.record.image, 'https://www.lg.com/ae/images/artcool.jpg');
  assert.equal(result.record.tons, '1.5');
});

check('validateProductForm names the problem for common mistakes', () => {
  const cases = [
    [{ image: 'http://www.lg.com/x.jpg' }, 'image'],
    [{ image: 'www.lg.com/x.jpg' }, 'image'],
    [{ amazonQuery: 'https://www.amazon.ae/dp/B0TEST1234' }, 'amazonQuery'],
    [{ priceMin: '2,300' }, 'priceBand'],
    [{ priceMin: '3000', priceMax: '2000' }, 'priceBand'],
    [{ priceMin: '' }, 'priceBand'],
    [{ editorialScore: '7' }, 'editorialScore'],
    [{ title: 'ab' }, 'title'],
    [{ description: 'too short' }, 'description'],
    [{ category: 'fridges' }, 'category'],
  ];
  for (const [change, field] of cases) {
    const result = validateProductForm({ ...FORM, ...change });
    assert.equal(result.ok, false, JSON.stringify(change));
    assert.ok(result.errors[field], `${JSON.stringify(change)} should flag ${field}`);
    assert.equal(result.firstError, result.errors[field]);
  }
});

check('applyEdit stores only differences for a built-in and clears an unchanged edit', () => {
  let map = applyEdit({}, builtInsById, 'ac-1', { ...ac1, image: 'https://example.com/a.jpg' });
  assert.deepEqual(map, { 'ac-1': { image: 'https://example.com/a.jpg' } });
  map = applyEdit(map, builtInsById, 'ac-1', { ...ac1 });
  assert.deepEqual(map, {});
});

check('applyEdit keeps a hidden flag set by another tab and never mutates its input', () => {
  const current = { 'ac-1': { hidden: true } };
  const map = applyEdit(current, builtInsById, 'ac-1', { ...ac1, image: 'https://example.com/a.jpg' });
  assert.deepEqual(map['ac-1'], { image: 'https://example.com/a.jpg', hidden: true });
  assert.deepEqual(applyEdit(map, builtInsById, 'ac-1', { ...ac1 })['ac-1'], { hidden: true });
  assert.deepEqual(current, { 'ac-1': { hidden: true } });
});

check('applyEdit replaces an added product, keeps addedAt, and rejects unknown ids', () => {
  const map = applyEdit({ 'lg-artcool-aaaa': VALID_NEW }, builtInsById, 'lg-artcool-aaaa', { ...VALID_NEW, addedAt: undefined, title: 'LG ArtCool Renamed' });
  assert.equal(map['lg-artcool-aaaa'].title, 'LG ArtCool Renamed');
  assert.equal(map['lg-artcool-aaaa'].addedAt, 1000);
  assert.throws(() => applyEdit({}, builtInsById, 'gone-aaaa', VALID_NEW), CatalogueError);
});

check('applyAdd picks a free id and stamps addedAt', () => {
  const { products: map, id } = applyAdd({}, builtInsById, { ...VALID_NEW, addedAt: undefined }, { now: 5000, random: () => 0 });
  assert.equal(id, 'lg-artcool-1-5-ton-t3-inverter-split-ac-0000');
  assert.equal(map[id].addedAt, 5000);
  assert.ok(buildCatalogue(products, map).visible.some((p) => p.id === id));
});

check('hide, restore and remove each touch only what they should', () => {
  let map = applyHide({ 'ac-1': { image: 'https://example.com/a.jpg' } }, builtInsById, 'ac-1');
  assert.deepEqual(map['ac-1'], { image: 'https://example.com/a.jpg', hidden: true });
  map = applyRestore(map, builtInsById, 'ac-1');
  assert.deepEqual(map, {});
  assert.deepEqual(applyRemoveAdded({ 'lg-artcool-aaaa': VALID_NEW }, builtInsById, 'lg-artcool-aaaa'), {});
  assert.throws(() => applyHide({}, builtInsById, 'lg-artcool-aaaa'), CatalogueError);
  assert.throws(() => applyRestore({}, builtInsById, 'lg-artcool-aaaa'), CatalogueError);
  assert.throws(() => applyRemoveAdded({}, builtInsById, 'ac-1'), CatalogueError);
});

check('describeSaveError turns failures into messages a person can act on', () => {
  assert.match(describeSaveError({ code: 'permission-denied' }), /not allowed to change products/);
  assert.match(describeSaveError({ code: 'unauthenticated' }), /not allowed to change products/);
  assert.match(describeSaveError({ code: 'unavailable' }), /connection/);
  assert.match(describeSaveError({ code: 'resource-exhausted' }), /daily limit/);
  assert.equal(describeSaveError(new CatalogueError('That product no longer exists.')), 'That product no longer exists.');
  assert.match(describeSaveError(new Error('internal detail')), /^Could not save/);
});

console.log(`${passed} catalogue checks passed${failures.length ? `, ${failures.length} failed` : ''}.`);
if (failures.length > 0) {
  console.error(failures.map((f) => `  ✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log('✅ Catalogue rules OK.');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/check-catalogue.mjs`
Expected: FAIL — `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…/src/catalogueMerge.js'`.

- [ ] **Step 3: Implement `src/catalogueMerge.js`**

```js
/**
 * CoolLivingUAE — Catalogue overrides: the rules
 * ---------------------------------------------------------------------------
 * Product changes made in the admin dashboard live in one Firestore document,
 * catalogue/overrides, as a map of product id → entry. What counts as a valid
 * entry, how entries merge over the built-in catalogue, and how each dashboard
 * action changes the map are all decided here, with no Firebase import, so
 * scripts/check-catalogue.mjs can test them in Node. Firestore reads and
 * writes live in src/catalogue.js.
 *
 * Entries:
 *   - built-in product (id in src/data/products.js): only the fields the admin
 *     changed, plus an optional `hidden: true`. Storing differences means later
 *     code fixes to a product's other fields still reach visitors.
 *   - admin-added product: a complete record plus `addedAt` (ms since epoch).
 *
 * Design: docs/superpowers/specs/2026-10-04-admin-catalogue-editing-design.md
 * ---------------------------------------------------------------------------
 */

export const CATEGORIES = ['smart-acs', 'air-purifiers', 'smart-thermostats'];

/** Fields the dashboard edits. Any other key on an entry is ignored. */
export const EDITABLE_FIELDS = [
  'title', 'brand', 'category', 'priceBand', 'editorialScore',
  'image', 'amazonQuery', 'description', 'tons',
];

/** Fields an admin-added product must have. `image` and `tons` may be empty. */
const REQUIRED_FIELDS = ['title', 'brand', 'category', 'priceBand', 'editorialScore', 'amazonQuery', 'description'];

export const FIELD_LIMITS = {
  title: { min: 3, max: 140 },
  brand: { min: 1, max: 60 },
  amazonQuery: { min: 3, max: 120 },
  description: { min: 40, max: 4000 },
  image: { max: 600 },
  tons: { max: 10 },
  price: { min: 1, max: 1_000_000 },
  score: { min: 0, max: 5 },
};

const FIELD_MESSAGES = {
  title: `Enter a title of ${FIELD_LIMITS.title.min}–${FIELD_LIMITS.title.max} characters.`,
  brand: `Enter a brand of ${FIELD_LIMITS.brand.min}–${FIELD_LIMITS.brand.max} characters.`,
  category: 'Choose one of the three categories.',
  priceBand: 'Enter the price range in whole dirhams, e.g. 1750 and 2200, with the maximum at least the minimum.',
  editorialScore: 'Enter an editorial score from 0 to 5.',
  image: 'The photo link must start with https://, or leave it empty.',
  amazonQuery: `Enter Amazon search words (${FIELD_LIMITS.amazonQuery.min}–${FIELD_LIMITS.amazonQuery.max} characters), not a link.`,
  description: `Write a description of ${FIELD_LIMITS.description.min}–${FIELD_LIMITS.description.max} characters.`,
  tons: `Tonnage must be ${FIELD_LIMITS.tons.max} characters or fewer, e.g. 1.5.`,
};

/** An error whose message is written for the admin and safe to display as-is. */
export class CatalogueError extends Error {}

const PRODUCT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/i;
const SITE_IMAGE = /^\/images\/[A-Za-z0-9._/-]+$/;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// "https://…", "ftp://…" or "www.…" — search terms must be words, not a link.
const looksLikeUrl = (text) => /^[a-z][a-z0-9+.-]*:\/\//i.test(text) || /^www\./i.test(text);

function boundedString(value, { min = 0, max }) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

/** True for an id an admin-added product may use. */
export function isValidProductId(id) {
  return typeof id === 'string' && id.length <= 80 && PRODUCT_ID.test(id);
}

/** Validates one editable field: { ok: true, value } with the cleaned value, or { ok: false }. */
function checkField(field, value) {
  switch (field) {
    case 'title':
    case 'brand':
    case 'description': {
      const text = boundedString(value, FIELD_LIMITS[field]);
      return text === null ? { ok: false } : { ok: true, value: text };
    }
    case 'amazonQuery': {
      const text = boundedString(value, FIELD_LIMITS.amazonQuery);
      return text === null || looksLikeUrl(text) ? { ok: false } : { ok: true, value: text };
    }
    case 'category':
      return CATEGORIES.includes(value) ? { ok: true, value } : { ok: false };
    case 'priceBand': {
      if (!isPlainObject(value)) return { ok: false };
      const { min, max } = value;
      const inRange = (n) => Number.isInteger(n) && n >= FIELD_LIMITS.price.min && n <= FIELD_LIMITS.price.max;
      return inRange(min) && inRange(max) && min <= max ? { ok: true, value: { min, max } } : { ok: false };
    }
    case 'editorialScore':
      return typeof value === 'number' && Number.isFinite(value)
        && value >= FIELD_LIMITS.score.min && value <= FIELD_LIMITS.score.max
        ? { ok: true, value } : { ok: false };
    case 'image': {
      if (value === '' || value === undefined) return { ok: true, value: '' };
      if (typeof value !== 'string') return { ok: false };
      const link = value.trim();
      if (link === '') return { ok: true, value: '' };
      if (link.length > FIELD_LIMITS.image.max) return { ok: false };
      const sitePath = SITE_IMAGE.test(link) && !link.includes('..');
      return HTTPS_URL.test(link) || sitePath ? { ok: true, value: link } : { ok: false };
    }
    case 'tons': {
      if (value === '' || value === undefined) return { ok: true, value: '' };
      const text = boundedString(value, { max: FIELD_LIMITS.tons.max });
      return text === null ? { ok: false } : { ok: true, value: text };
    }
    default:
      return { ok: false };
  }
}

/**
 * Cleans an entry read from, or about to be written to, catalogue/overrides.
 *
 * @param {object}  entry
 * @param {object}  options
 * @param {boolean} options.isBuiltIn  true: a partial entry for a built-in
 *                                     product; false: a complete added product.
 * @returns {object|null} The cleaned entry, or null when any present field is
 *                        invalid or an added product lacks a required field.
 */
export function sanitizeEntry(entry, { isBuiltIn }) {
  if (!isPlainObject(entry)) return null;
  const clean = {};
  for (const field of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(entry, field)) continue;
    const result = checkField(field, entry[field]);
    if (!result.ok) return null;
    clean[field] = result.value;
  }
  if (isBuiltIn) {
    if (entry.hidden === true) clean.hidden = true;
    return clean;
  }
  if (!REQUIRED_FIELDS.every((field) => field in clean)) return null;
  if (!Number.isFinite(entry.addedAt)) return null;
  if (!('image' in clean)) clean.image = '';
  clean.addedAt = entry.addedAt;
  return clean;
}

/**
 * Merges stored overrides over the built-in catalogue.
 *
 * @param {object[]} builtIns  Records from src/data/products.js.
 * @param {object}   overrides The `products` map from catalogue/overrides.
 * @returns {{ visible: object[], admin: object[] }}
 *   visible — what visitors see: built-ins with valid overrides applied and
 *             hidden ones removed, then valid added products by addedAt.
 *   admin   — every product, hidden included, flagged isBuiltIn, isHidden,
 *             isEdited. An invalid override is ignored; an invalid added
 *             product is left out.
 */
export function buildCatalogue(builtIns, overrides) {
  const map = isPlainObject(overrides) ? overrides : {};
  const builtInIds = new Set(builtIns.map((p) => p.id));

  const merged = builtIns.map((base) => {
    const entry = Object.prototype.hasOwnProperty.call(map, base.id)
      ? sanitizeEntry(map[base.id], { isBuiltIn: true })
      : null;
    const { hidden = false, ...changes } = entry || {};
    return { ...base, ...changes, isBuiltIn: true, isHidden: hidden, isEdited: Object.keys(changes).length > 0 };
  });

  const added = Object.keys(map)
    .filter((id) => !builtInIds.has(id) && isValidProductId(id))
    .map((id) => ({ id, entry: sanitizeEntry(map[id], { isBuiltIn: false }) }))
    .filter(({ entry }) => entry !== null)
    .sort((a, b) => a.entry.addedAt - b.entry.addedAt || a.id.localeCompare(b.id))
    .map(({ id, entry }) => ({ id, ...entry, isBuiltIn: false, isHidden: false, isEdited: false }));

  const admin = [...merged, ...added];
  return { visible: admin.filter((p) => !p.isHidden), admin };
}

/** The editable fields of `edited` that differ from `builtIn`. */
export function diffAgainstBuiltIn(builtIn, edited) {
  const changes = {};
  for (const field of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(edited, field)) continue;
    const before = field === 'tons' ? (builtIn.tons ?? '') : builtIn[field];
    const after = edited[field];
    const same = field === 'priceBand'
      ? before?.min === after?.min && before?.max === after?.max
      : before === after;
    if (!same) changes[field] = after;
  }
  return changes;
}

/** Lowercase a-z0-9 words joined by hyphens, at most 60 characters. */
export function slugify(text) {
  const slug = String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'product';
}

/**
 * An id for a new product: the title's slug plus four random base-36
 * characters, retried until it is not in `takenIds`.
 */
export function makeProductId(title, takenIds, random = Math.random) {
  const base = slugify(title);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Array.from({ length: 4 }, () => ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)]).join('');
    const id = `${base}-${suffix}`;
    if (!takenIds.has(id)) return id;
  }
  throw new CatalogueError('Could not create an address for this product. Please try again.');
}

/**
 * Turns the dashboard's form state (strings from inputs, or numbers from an
 * existing record) into a record for saving.
 *
 * @returns {{ ok: boolean, record: object, errors: object, firstError: string }}
 */
export function validateProductForm(form) {
  const toWholeNumber = (value) => {
    if (typeof value === 'number') return value;
    return typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value) : Number.NaN;
  };
  const candidate = {
    title: form.title,
    brand: form.brand,
    category: form.category,
    priceBand: { min: toWholeNumber(form.priceMin), max: toWholeNumber(form.priceMax) },
    editorialScore: form.editorialScore === '' || form.editorialScore === undefined || form.editorialScore === null
      ? Number.NaN : Number(form.editorialScore),
    image: typeof form.image === 'string' ? form.image.trim() : '',
    amazonQuery: form.amazonQuery,
    description: form.description,
    tons: typeof form.tons === 'string' ? form.tons : '',
  };

  const record = {};
  const errors = {};
  for (const field of EDITABLE_FIELDS) {
    const result = checkField(field, candidate[field]);
    if (result.ok) record[field] = result.value;
    else errors[field] = FIELD_MESSAGES[field];
  }
  const firstError = EDITABLE_FIELDS.map((field) => errors[field]).find(Boolean) || '';
  return { ok: firstError === '', record, errors, firstError };
}

const NO_LONGER_EXISTS = 'That product no longer exists. Reload the dashboard and try again.';
const cleanBuiltInEntry = (products, id) => sanitizeEntry(products[id], { isBuiltIn: true }) || {};

/**
 * Saves an edited record. A built-in keeps only its differences — none at all
 * removes the entry — and keeps any hidden flag already stored, which may
 * have been set from another tab since this one loaded.
 */
export function applyEdit(products, builtInsById, id, record) {
  const next = { ...products };
  const base = builtInsById.get(id);
  if (base) {
    const hidden = cleanBuiltInEntry(products, id).hidden === true;
    const changes = diffAgainstBuiltIn(base, record);
    if (Object.keys(changes).length === 0 && !hidden) delete next[id];
    else next[id] = { ...changes, ...(hidden ? { hidden: true } : {}) };
    return next;
  }
  const existing = products[id];
  if (!isPlainObject(existing)) throw new CatalogueError(NO_LONGER_EXISTS);
  next[id] = { ...record, addedAt: existing.addedAt };
  return next;
}

/** Adds a new product under a fresh id. */
export function applyAdd(products, builtInsById, record, { now = Date.now(), random = Math.random } = {}) {
  const taken = new Set([...builtInsById.keys(), ...Object.keys(products)]);
  const id = makeProductId(record.title, taken, random);
  return { products: { ...products, [id]: { ...record, addedAt: now } }, id };
}

/** Hides a built-in product, keeping any other changes stored for it. */
export function applyHide(products, builtInsById, id) {
  if (!builtInsById.has(id)) throw new CatalogueError(NO_LONGER_EXISTS);
  return { ...products, [id]: { ...cleanBuiltInEntry(products, id), hidden: true } };
}

/** Undoes every change to a built-in product, un-hiding it too. */
export function applyRestore(products, builtInsById, id) {
  if (!builtInsById.has(id)) throw new CatalogueError(NO_LONGER_EXISTS);
  const next = { ...products };
  delete next[id];
  return next;
}

/** Permanently removes an admin-added product. */
export function applyRemoveAdded(products, builtInsById, id) {
  if (builtInsById.has(id) || !Object.prototype.hasOwnProperty.call(products, id)) throw new CatalogueError(NO_LONGER_EXISTS);
  const next = { ...products };
  delete next[id];
  return next;
}

/** A message the admin can act on, for any error a save can raise. */
export function describeSaveError(error) {
  if (error instanceof CatalogueError) return error.message;
  switch (error?.code) {
    case 'permission-denied':
    case 'unauthenticated':
      return 'This account is not allowed to change products. Sign out, sign in with the admin account and try again.';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Could not reach the database — check your connection and try again.';
    case 'resource-exhausted':
      return 'The free daily limit has been reached — try again tomorrow.';
    case 'invalid-argument':
      return 'The database rejected this change. Reload the dashboard and try again; if it keeps happening, the catalogue may have grown too large.';
    default:
      return 'Could not save. Please try again.';
  }
}
```

- [ ] **Step 4: Run the checks to verify they pass**

Run: `node scripts/check-catalogue.mjs`
Expected: `18 catalogue checks passed.` then `✅ Catalogue rules OK.`, exit code 0.

- [ ] **Step 5: Register the script and commit**

In `package.json`, after the `"generate-brand-assets"` script line, add:

```json
    "check-catalogue": "node scripts/check-catalogue.mjs",
```

(keep valid JSON — the line before it needs its trailing comma, the last script line has none).

Run: `npm run check-catalogue` → passes. Run: `npm run lint` → still 11 problems.

```bash
git add src/catalogueMerge.js scripts/check-catalogue.mjs package.json
git commit -F - <<'EOF'
feat: catalogue override rules for the admin product editor

Pure rules behind saving admin product changes to Firestore: field
validation with the spec's limits, merging overrides over the built-in
catalogue, the edit/add/hide/restore/remove operations, and error
messages for the admin. No Firebase import, so npm run check-catalogue
tests it in Node — including that all 60 built-in records pass the
limits unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Firestore access and security rules (HIGH RISK)

**Files:**
- Create: `scripts/check-rules.mjs`
- Create: `src/catalogue.js`
- Modify: `firestore.rules` (insert before the `// ── Everything else` block)
- Modify: `package.json`, `CLAUDE.md`

**Interfaces:**
- Consumes: from Task 1 — `applyEdit`, `applyAdd`, `applyHide`, `applyRestore`, `applyRemoveAdded`, `describeSaveError`.
- Produces (`src/catalogue.js`):
  - `fetchCatalogueOverrides(): Promise<object>` — the `products` map, `{}` when the document does not exist; rejects with the Firestore error on failure.
  - `saveEdit(id, record)`, `hideProduct(id)`, `restoreOriginal(id)`, `removeAddedProduct(id)`: `Promise<{ products: object }>`
  - `addProduct(record): Promise<{ products: object, id: string }>`
  - All five reject with an `Error` whose message is safe to display.

- [ ] **Step 1: Write the failing live-rules check**

Create `scripts/check-rules.mjs`:

```js
/**
 * CoolLivingUAE — Live Firestore rules check
 * ---------------------------------------------------------------------------
 * Run: npm run check-rules
 *
 * Sends unauthenticated requests to the live database, exactly as any visitor
 * could, and checks each answer matches firestore.rules. Writes carry a
 * precondition that can never hold (an updateTime in the year 2000), so even
 * a write the rules wrongly allowed could not change anything.
 *
 * The project id and web API key are read from src/firebase.js; the key is a
 * public identifier, not a secret.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';

const config = fs.readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const API_KEY = config.match(/apiKey:\s*"([^"]+)"/)[1];
const PROJECT = config.match(/projectId:\s*"([^"]+)"/)[1];
const DATABASE = `projects/${PROJECT}/databases/(default)`;
const API = `https://firestore.googleapis.com/v1/${DATABASE}/documents`;
const NEVER = '2000-01-01T00:00:00Z';

async function request(url, body) {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${API_KEY}`, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  const json = await res.json().catch(() => ({}));
  const error = Array.isArray(json) ? json[0]?.error : json.error;
  return { status: res.status, code: error?.status || 'OK' };
}

const read = (path) => request(`${API}/${path}`);
const list = (collection) => request(`${API}/${collection}?pageSize=1&mask.fieldPaths=zzNoSuchField`);
const write = (path, fields) => request(`${API}:commit`, {
  writes: [{
    update: { name: `${DATABASE}/documents/${path}`, fields },
    updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: { updateTime: NEVER },
  }],
});
const approvedReviews = () => request(`${API}:runQuery`, {
  structuredQuery: {
    from: [{ collectionId: 'residentReviews' }],
    where: { fieldFilter: { field: { fieldPath: 'approved' }, op: 'EQUAL', value: { booleanValue: true } } },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
    limit: 1,
  },
});

const CHECKS = [
  ['anyone can read catalogue/overrides', () => read('catalogue/overrides'), (r) => r.status === 200 || r.status === 404],
  ['a signed-out visitor cannot write catalogue/overrides', () => write('catalogue/overrides', { products: { mapValue: { fields: {} } } }), (r) => r.code === 'PERMISSION_DENIED'],
  ['other catalogue documents stay private', () => read('catalogue/not-overrides'), (r) => r.code === 'PERMISSION_DENIED'],
  ['installation leads cannot be listed', () => list('installationRequests'), (r) => r.code === 'PERMISSION_DENIED'],
  ['unfiltered review lists are refused', () => list('residentReviews'), (r) => r.code === 'PERMISSION_DENIED'],
  ['approved reviews can be queried (rules + index)', approvedReviews, (r) => r.status === 200],
];

let failed = 0;
for (const [label, run, expect] of CHECKS) {
  const result = await run();
  const ok = expect(result);
  if (!ok) failed += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} ${result.status} ${result.code}`);
}
console.log(failed ? `\n❌ ${failed} rule check(s) failed.` : '\n✅ Live rules behave as firestore.rules says.');
process.exit(failed ? 1 : 0);
```

Add to `package.json` scripts, after `check-catalogue`:

```json
    "check-rules": "node scripts/check-rules.mjs",
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run check-rules`
Expected: FAIL on `anyone can read catalogue/overrides` (`403 PERMISSION_DENIED` — the default deny still covers `catalogue`); the other five lines `ok`.

- [ ] **Step 3: Add the rules block**

In `firestore.rules`, insert immediately above `    // ── Everything else ───`:

```
    // ── Catalogue overrides ───────────────────────────────────────────────
    // Product changes made in the admin dashboard: one document holding a
    // map of product id → entry (src/catalogueMerge.js). Readable by anyone —
    // it is the public catalogue — and writable only by an allowlisted admin.
    // Rules cannot iterate a map, so the dashboard validates each entry before
    // saving and buildCatalogue() validates it again when the site reads it.
    match /catalogue/{docId} {
      allow get: if docId == 'overrides';
      allow create, update: if isAdmin()
        && docId == 'overrides'
        && request.resource.data.keys().hasOnly(['products', 'updatedAt'])
        && request.resource.data.products is map
        && request.resource.data.updatedAt == request.time;
    }

```

- [ ] **Step 4: Compile the rules without deploying**

Run: `firebase deploy --only firestore:rules --dry-run --project coolliving-uae --non-interactive`
Expected: `rules file firestore.rules compiled successfully` and `Dry run complete!`. Any compilation error: fix the block and repeat; do not deploy.

- [ ] **Step 5: Deploy the rules**

Run: `firebase deploy --only firestore:rules --project coolliving-uae --non-interactive`
Expected: `released rules firestore.rules to cloud.firestore` and `Deploy complete!`.

- [ ] **Step 6: Run the live check to verify it passes**

Run: `npm run check-rules`
Expected: all six lines `ok`; the first shows `404 NOT_FOUND` (readable, nothing saved yet). If the write check is not `PERMISSION_DENIED`, stop: the rules are wrong — redeploy the previous `firestore.rules` from git (`git stash; firebase deploy --only firestore:rules …; git stash pop`) before anything else.

- [ ] **Step 7: Implement `src/catalogue.js`**

```js
/**
 * CoolLivingUAE — Catalogue overrides: Firestore access
 * ---------------------------------------------------------------------------
 * Reads and writes catalogue/overrides, the one document holding every
 * product change made in the admin dashboard. The rules for what goes in it
 * live in src/catalogueMerge.js; this module only moves data.
 *
 * One read per page load keeps the site inside Firestore's free quota (50,000
 * reads a day). Writes run in a transaction — read, change one entry, write —
 * so two open dashboard tabs cannot overwrite each other's saves.
 * firestore.rules lets anyone read the document and only an allowlisted
 * admin write it.
 * ---------------------------------------------------------------------------
 */

import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { products as builtIns } from './data/products';
import {
  applyAdd, applyEdit, applyHide, applyRemoveAdded, applyRestore, describeSaveError,
} from './catalogueMerge';

const overridesRef = doc(db, 'catalogue', 'overrides');
const builtInsById = new Map(builtIns.map((p) => [p.id, p]));

function productsOf(snapshot) {
  const products = snapshot.exists() ? snapshot.data().products : null;
  return products !== null && typeof products === 'object' && !Array.isArray(products) ? products : {};
}

/**
 * The stored overrides: id → entry, or {} when nothing has been saved yet.
 * Rejects with the Firestore error when the read fails; callers fall back to
 * the built-in catalogue.
 */
export async function fetchCatalogueOverrides() {
  return productsOf(await getDoc(overridesRef));
}

/**
 * Applies one change in a transaction. `change` must be pure: Firestore may
 * run it more than once if the document changes underneath it.
 */
async function commit(change) {
  try {
    return await runTransaction(db, async (transaction) => {
      const result = change(productsOf(await transaction.get(overridesRef)));
      transaction.set(overridesRef, { products: result.products, updatedAt: serverTimestamp() });
      return result;
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('[catalogue] save failed:', error);
    throw new Error(describeSaveError(error));
  }
}

export const saveEdit = (id, record) =>
  commit((current) => ({ products: applyEdit(current, builtInsById, id, record) }));

export const addProduct = (record) =>
  commit((current) => applyAdd(current, builtInsById, record));

export const hideProduct = (id) =>
  commit((current) => ({ products: applyHide(current, builtInsById, id) }));

export const restoreOriginal = (id) =>
  commit((current) => ({ products: applyRestore(current, builtInsById, id) }));

export const removeAddedProduct = (id) =>
  commit((current) => ({ products: applyRemoveAdded(current, builtInsById, id) }));
```

- [ ] **Step 8: Build and lint**

Run: `npm run build` → `✓ built`. Run: `npm run lint` → 11 problems (the module is not imported yet, so the count is unchanged).

- [ ] **Step 9: Document it in `CLAUDE.md`**

In the Commands block, after the `generate-brand-assets` line, add:

```
npm run check-catalogue  # Rules for admin catalogue changes (src/catalogueMerge.js); no network
npm run check-rules      # Probes the LIVE Firestore rules as a signed-out visitor; never writes
```

In the Firebase section, change `Two collections:` to `Three collections:` and add after the `residentReviews` bullet:

```
- `catalogue/overrides` — one document holding every product change made in the admin dashboard
  (see "Catalogue overrides"). Readable by anyone, writable only by an allowlisted admin.
```

After the `### Data flow` section (before `### Brand assets`), add:

```
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
```

In "Deployment state", replace the bullet beginning `- **Whether \`firestore.rules\` has been deployed is unconfirmed.**` (through `configured in the console.`) with:

```
- **`firestore.rules` is deployed** and is the source of truth: the owner reads leads in the live
  dashboard, which only these rules allow, and `npm run check-rules` probes the live behaviour.
- The Firebase CLI on the owner's machine is signed in as the owner, so
  `firebase deploy --only firestore:rules` can run from here — only with the owner's explicit
  approval, since it changes production access control. Compile first with `--dry-run`.
```

and replace the paragraph `Deploying rules requires \`firebase login\`, which needs an interactive browser sign-in that Claude Code cannot complete. That step must be run by the user.` with:

```
If the CLI is ever signed out, `firebase login` needs an interactive browser sign-in that only the
owner can complete.
```

- [ ] **Step 10: Commit**

```bash
git add scripts/check-rules.mjs src/catalogue.js firestore.rules package.json CLAUDE.md
git commit -F - <<'EOF'
feat: catalogue overrides storage and security rules

Adds src/catalogue.js — one read of catalogue/overrides per page load,
transactional writes — and the firestore.rules block that lets anyone
read that document and only an allowlisted admin write it. The rules are
deployed; npm run check-rules probes the live behaviour as a signed-out
visitor, and its writes carry an impossible precondition so they can
never apply. It failed on the catalogue read before the deploy and
passes after.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Catalogue in the app — public pages and the admin editor

**Files:**
- Create: `scripts/check-site.mjs`
- Create: `src/components/ImageLinkField.jsx`
- Modify: `src/App.jsx` — imports; `initialProducts` const (~line 61); `ProductReviewPage` (~line 765); `SessionOnlyNotice` + `AdminDashboard` product state, helpers, overview, products tab, edit form, add tab (~lines 1755–2430); `AboutUsSection` (~line 2499); `App` state, `renderPage`, About usage (~lines 2540–2730)
- Modify: `package.json`, `CLAUDE.md`

**Interfaces:**
- Consumes: Task 1 `buildCatalogue`, `validateProductForm`; Task 2 `fetchCatalogueOverrides`, `saveEdit`, `addProduct`, `hideProduct`, `restoreOriginal`, `removeAddedProduct`.
- Produces:
  - `ProductReviewPage({ productId, products, catalogueStatus, navigate })` with `catalogueStatus: 'loading' | 'ready' | 'error'`
  - `AdminDashboard({ adminProducts, catalogueStatus, onRetryCatalogue, catalogueActions, onLogout })` where `catalogueActions` = `{ saveEdit(id, record), addProduct(record), hideProduct(id), restoreOriginal(id), removeAddedProduct(id) }`, each resolving to the Task 2 result
  - `AboutUsSection({ productCount })`
  - `ImageLinkField({ id, value, onChange(value), inputClassName, labelClassName })`

- [ ] **Step 1: Write the failing site check**

Create `scripts/check-site.mjs`:

```js
/**
 * CoolLivingUAE — Rendered-site check
 * ---------------------------------------------------------------------------
 * Against a served build (other terminal: npx vite preview --port 4173):
 *     npm run check-site
 * Against the live site:
 *     BASE=https://coollivinguae.com npm run check-site
 *
 * Loads every page in headless Chrome and checks what a visitor and a crawler
 * see: canonical URL, robots directive, an <h1>, images that load and match
 * the catalogue, no console errors or failed requests. The expected catalogue
 * is the built-ins merged with the live catalogue/overrides document.
 *
 * Then the product page's three outcomes for an id only the catalogue read
 * can answer, simulated by holding or aborting every Firestore request:
 *   loading → "Loading…" and no noindex yet (it may be a real product)
 *   missing → "Product not found" + noindex
 *   failed  → "Product unavailable" + noindex, while built-in pages render
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import puppeteer from 'puppeteer';
import { products as builtIns } from '../src/data/products.js';
import { crawlablePaths } from '../src/routes.js';
import { buildCatalogue } from '../src/catalogueMerge.js';

const BASE = (process.env.BASE || 'http://localhost:4173').replace(/\/+$/, '');
const SITE = (process.env.VITE_SITE_URL || 'https://coollivinguae.com').replace(/\/+$/, '');
const UNKNOWN_PRODUCT = '/product/no-such-product-zz99';
const config = fs.readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const API_KEY = config.match(/apiKey:\s*"([^"]+)"/)[1];
const PROJECT = config.match(/projectId:\s*"([^"]+)"/)[1];

const failures = [];
function report(ok, label, detail = '') {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) failures.push(`${label} ${detail}`);
}

// Firestore's REST API returns typed values; convert them to plain JS.
function fromFirestore(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestore);
  if ('mapValue' in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, fromFirestore(v)]));
  }
  return undefined;
}

async function expectedCatalogue() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/catalogue/overrides?key=${API_KEY}`;
  const res = await fetch(url);
  if (res.status === 404) return buildCatalogue(builtIns, {});
  if (!res.ok) throw new Error(`could not read catalogue/overrides (HTTP ${res.status})`);
  const docFields = (await res.json()).fields || {};
  return buildCatalogue(builtIns, fromFirestore({ mapValue: { fields: docFields } }).products || {});
}

async function openPage(browser, path, { firestore = 'allow', holdMs = 0 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 140)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 140)}`));
  if (firestore !== 'allow' || holdMs) {
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      if (!req.url().includes('firestore.googleapis.com')) { req.continue(); return; }
      if (firestore === 'block') { req.abort(); return; }
      await new Promise((r) => setTimeout(r, holdMs));
      req.continue();
    });
  } else {
    page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') problems.push(`requestfailed ${r.url().slice(0, 100)}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('firestore.googleapis.com')) problems.push(`HTTP ${r.status()} ${r.url().slice(0, 100)}`); });
  }
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#root > *', { timeout: 10000 });
  return { page, problems };
}

const pageState = (page) => page.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent.trim() || '',
  robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
  main: document.querySelector('main')?.innerText || '',
}));

async function crawl(browser, catalogue) {
  const byId = new Map(catalogue.admin.map((p) => [p.id, p]));
  const added = catalogue.visible.filter((p) => !p.isBuiltIn).map((p) => `/product/${p.id}`);
  const paths = [...crawlablePaths(builtIns), ...added];
  console.log(`\n== ${paths.length} pages (${added.length} admin-added)`);
  for (const path of paths) {
    const { page, problems } = await openPage(browser, path);
    const productId = path.startsWith('/product/') ? path.split('/')[2] : null;
    const product = productId ? byId.get(productId) : null;
    const hidden = product?.isHidden === true;
    if (hidden) {
      await page.waitForFunction(() => document.querySelector('h1')?.textContent.trim() === 'Product not found', { timeout: 15000 }).catch(() => {});
    } else {
      await page.waitForFunction((want) => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === want,
        { timeout: 15000 }, `${SITE}${path === '/' ? '' : path}`).catch(() => {});
    }
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), { timeout: 20000 }).catch(() => problems.push('images still loading after 20s'));
    const state = await pageState(page);
    const facts = await page.evaluate(() => ({
      broken: [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute('src')),
      cards: [...document.querySelectorAll('article')].map((a) => ({ title: a.querySelector('h3')?.textContent.trim(), img: a.querySelector('img')?.getAttribute('src') || '' })),
      figure: document.querySelector('figure img')?.getAttribute('src') || '',
    }));

    const issues = [...problems];
    if (hidden) {
      if (state.h1 !== 'Product not found' || state.robots !== 'noindex, nofollow') issues.push(`hidden product shows "${state.h1}" (${state.robots})`);
    } else {
      if (state.canonical !== `${SITE}${path === '/' ? '' : path}`) issues.push(`canonical ${state.canonical}`);
      if (state.robots !== 'index, follow') issues.push(`robots ${state.robots}`);
      if (!state.h1) issues.push('no h1');
    }
    if (facts.broken.length) issues.push(`broken images ${facts.broken.join(', ')}`);
    if (path.startsWith('/category/')) {
      const expected = catalogue.visible.filter((p) => p.category === path.split('/')[2]);
      if (facts.cards.length !== expected.length) issues.push(`${facts.cards.length} cards, expected ${expected.length}`);
      facts.cards.forEach((card, i) => {
        if (expected[i] && (card.title !== expected[i].title || card.img !== expected[i].image)) {
          issues.push(`card ${i + 1} shows "${card.title}" / "${card.img}", expected "${expected[i].title}" / "${expected[i].image}"`);
        }
      });
    }
    if (product && !hidden && facts.figure !== product.image) issues.push(`main image "${facts.figure}", expected "${product.image}"`);
    report(issues.length === 0, path, issues.join(' | '));
    await page.close();
  }
}

async function productStates(browser) {
  console.log('\n== product page states');

  // Held reads: the unknown id must wait in "Loading…" without noindex. The
  // hold stays well under Firestore's 10-second offline timeout, which would
  // otherwise turn a slow read into a failed one.
  {
    const { page } = await openPage(browser, UNKNOWN_PRODUCT, { holdMs: 2500 });
    await new Promise((r) => setTimeout(r, 800));
    const during = await pageState(page);
    report(during.main.includes('Loading…') && during.robots !== 'noindex, nofollow',
      'unknown id while the read is in flight → Loading…, not noindex', `(h1 "${during.h1}", robots "${during.robots}")`);
    await page.waitForFunction(() => document.querySelector('h1')?.textContent.trim() === 'Product not found', { timeout: 20000 }).catch(() => {});
    const after = await pageState(page);
    report(after.h1 === 'Product not found' && after.robots === 'noindex, nofollow',
      'unknown id once the read completes → Product not found + noindex', `(h1 "${after.h1}", robots "${after.robots}")`);
    await page.close();
  }

  // Failed reads: unknown id → unavailable; built-in → still renders.
  {
    const { page } = await openPage(browser, UNKNOWN_PRODUCT, { firestore: 'block' });
    await page.waitForFunction(() => /Product (unavailable|not found)/.test(document.querySelector('h1')?.textContent || ''), { timeout: 30000 }).catch(() => {});
    const state = await pageState(page);
    report(state.h1 === 'Product unavailable' && state.robots === 'noindex, nofollow',
      'unknown id when Firestore is unreachable → Product unavailable + noindex', `(h1 "${state.h1}", robots "${state.robots}")`);
    await page.close();
  }
  {
    const ac1 = builtIns.find((p) => p.id === 'ac-1');
    const { page } = await openPage(browser, '/product/ac-1', { firestore: 'block' });
    await page.waitForFunction((t) => document.querySelector('h1')?.textContent.trim() === t, { timeout: 10000 }, ac1.title).catch(() => {});
    const state = await pageState(page);
    report(state.h1 === ac1.title && state.robots === 'index, follow',
      'built-in product when Firestore is unreachable → the review still renders', `(h1 "${state.h1}")`);
    await page.close();
  }
}

const catalogue = await expectedCatalogue();
console.log(`Checking ${BASE} — ${catalogue.visible.length} visible products, ${catalogue.admin.length - catalogue.visible.length} hidden.`);
const browser = await puppeteer.launch({ headless: true });
try {
  await crawl(browser, catalogue);
  await productStates(browser);
} finally {
  await browser.close();
}
console.log(failures.length ? `\n❌ ${failures.length} failure(s).` : '\n✅ Site checks passed.');
process.exit(failures.length ? 1 : 0);
```

Add to `package.json` scripts, after `check-rules`:

```json
    "check-site": "node scripts/check-site.mjs",
```

- [ ] **Step 2: Run it against the current build to verify it fails**

Run: `npm run build`, then in a second terminal `npx vite preview --port 4173 --strictPort`, then `npm run check-site`.
Expected: the 73 pages pass; FAIL on `unknown id while the read is in flight → Loading…` (the page shows "Product not found" immediately) and on `unknown id when Firestore is unreachable → Product unavailable`. Built-in-when-unreachable passes.

- [ ] **Step 3: Create `src/components/ImageLinkField.jsx`**

```jsx
import React, { useState } from 'react';

/**
 * CoolLivingUAE — Photo link input for the admin product forms
 * ---------------------------------------------------------------------------
 * Photos are added as links because uploads would need Firebase Storage,
 * which is only offered on the pay-as-you-go Blaze plan. The field previews
 * the link so a mistake shows before saving, and says when a link does not
 * load an image. If a saved link breaks later, the site shows a neutral tile
 * instead (src/components/ProductImage.jsx).
 * ---------------------------------------------------------------------------
 */
export default function ImageLinkField({ id, value, onChange, inputClassName, labelClassName }) {
  // Remember which link failed, so correcting it clears the warning.
  const [failedLink, setFailedLink] = useState('');
  const link = value.trim();
  const previewable = /^https:\/\//i.test(link) || link.startsWith('/images/');

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>Photo Link</label>
      <input id={id} type="url" inputMode="url" className={inputClassName}
        placeholder="https://… from the manufacturer's website"
        value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-[10px] text-slate-400 mt-1">
        On the manufacturer's website, right-click the product photo and choose “Copy image address”.
        Use the manufacturer's photo, not one copied from Amazon. Leave empty to show a neutral tile.
      </p>
      {link && !previewable && (
        <p className="text-[11px] font-bold text-red-600 mt-1" role="alert">The link must start with https://</p>
      )}
      {previewable && failedLink !== link && (
        <img src={link} alt="Photo preview" onError={() => setFailedLink(link)}
          className="mt-2 h-24 w-auto max-w-full rounded-xl border border-slate-100 object-contain bg-white" />
      )}
      {previewable && failedLink === link && (
        <p className="text-[11px] font-bold text-red-600 mt-1" role="alert">
          This link doesn't load an image. Check you copied the image address, not the page address.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire the catalogue into `App` and the public pages**

In `src/App.jsx`:

(a) Imports — `useMemo` is already imported from `react` (and currently unused); this task uses it. Add after `import RouteLink from './components/RouteLink';`:

```js
import ImageLinkField from './components/ImageLinkField';
import { buildCatalogue, validateProductForm } from './catalogueMerge';
import {
  fetchCatalogueOverrides, saveEdit, addProduct, hideProduct, restoreOriginal, removeAddedProduct,
} from './catalogue';
```

Add `RotateCcw` to the lucide-react import list (after `Quote`).

(b) Delete the line `const initialProducts = catalogueProducts;`.

(c) Replace the start of `ProductReviewPage` — from `const ProductReviewPage = ({ productId, products, navigate }) => {` through the line `if (!product) return <NotFoundMessage navigate={navigate} title="Product not found" message="This product does not exist, or has been removed from our reviews." />;` — with:

```jsx
const ProductReviewPage = ({ productId, products, catalogueStatus, navigate }) => {
  const product = products.find(p => p.id === productId);
  // Admin-added products only exist once the catalogue read completes
  // (src/catalogue.js). Until then an unknown id is "not known yet", not
  // missing — marking it noindex now could drop a real product from Google.
  const pending = !product && catalogueStatus === 'loading';
  useEffect(() => {
    if (product) updateSEO(`${product.title} Review & Best Price UAE`, product.description);
    else if (catalogueStatus === 'error') updateSEO('Product Unavailable', 'This product could not be loaded.', '', '', true);
    else if (catalogueStatus === 'ready') updateSEO('Product Not Found', 'This product does not exist or has been removed.', '', '', true);
  }, [product, catalogueStatus]);
  if (pending) return <div className="p-20 text-center text-slate-400 font-bold">Loading…</div>;
  if (!product && catalogueStatus === 'error') {
    return <NotFoundMessage navigate={navigate} title="Product unavailable" message="We couldn't load this product just now. Please try again in a moment." />;
  }
  if (!product) return <NotFoundMessage navigate={navigate} title="Product not found" message="This product does not exist, or has been removed from our reviews." />;
```

(d) `AboutUsSection`: change `const AboutUsSection = () => (` to `const AboutUsSection = ({ productCount }) => (` and `{initialProducts.length}` to `{productCount}`.

(e) In `App`, replace `const [products, setProducts] = useState(initialProducts);` with:

```js
  // Admin changes to the catalogue (src/catalogue.js), merged over the
  // built-in products. 'loading' until the one read completes; on 'error'
  // visitors simply keep seeing the built-in catalogue.
  const [catalogue, setCatalogue] = useState({ status: 'loading', overrides: {} });
  const [catalogueReloadKey, setCatalogueReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetchCatalogueOverrides()
      .then((overrides) => { if (!cancelled) setCatalogue({ status: 'ready', overrides }); })
      .catch((error) => {
        if (import.meta.env.DEV) console.error('[catalogue] load failed:', error);
        if (!cancelled) setCatalogue((prev) => ({ ...prev, status: 'error' }));
      });
    return () => { cancelled = true; };
  }, [catalogueReloadKey]);
  const { visible: products, admin: adminProducts } = useMemo(
    () => buildCatalogue(catalogueProducts, catalogue.overrides),
    [catalogue.overrides]
  );
  const retryCatalogue = () => {
    setCatalogue((prev) => ({ ...prev, status: 'loading' }));
    setCatalogueReloadKey((key) => key + 1);
  };

  // Dashboard actions. Each saves through src/catalogue.js; on success the
  // saved map replaces local state, so every page — the dashboard included —
  // shows the change at once. Failures reject with a message safe to display.
  const runCatalogueAction = async (save) => {
    const result = await save();
    setCatalogue({ status: 'ready', overrides: result.products });
    return result;
  };
  const catalogueActions = {
    saveEdit: (id, record) => runCatalogueAction(() => saveEdit(id, record)),
    addProduct: (record) => runCatalogueAction(() => addProduct(record)),
    hideProduct: (id) => runCatalogueAction(() => hideProduct(id)),
    restoreOriginal: (id) => runCatalogueAction(() => restoreOriginal(id)),
    removeAddedProduct: (id) => runCatalogueAction(() => removeAddedProduct(id)),
  };
```

(f) In `renderPage`, change the product case to:

```jsx
      case 'product': return <ProductReviewPage productId={route.params.id} products={products} catalogueStatus={catalogue.status} navigate={navigate} />;
```

and the dashboard return to:

```jsx
        return <AdminDashboard adminProducts={adminProducts} catalogueStatus={catalogue.status} onRetryCatalogue={retryCatalogue} catalogueActions={catalogueActions} onLogout={handleLogout} />;
```

(g) Change `<AboutUsSection />` to `<AboutUsSection productCount={products.length} />`.

- [ ] **Step 5: Make the dashboard's product editor save**

In `src/App.jsx`:

(a) Replace the whole `SessionOnlyNotice` comment and component with:

```jsx
/**
 * Holds the product tabs until the stored overrides have loaded. A form
 * opened before then would show original values, and saving it would
 * silently discard changes made earlier.
 */
const CatalogueGate = ({ status, onRetry, children }) => {
  if (status === 'loading') {
    return <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-slate-400 font-bold">Loading products…</div>;
  }
  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-4" role="alert">
        <span>Your saved product changes could not be loaded, so editing is paused — saving now could overwrite them.</span>
        <button onClick={onRetry} className="bg-white border border-red-200 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-100 flex-shrink-0">Retry</button>
      </div>
    );
  }
  return children;
};

/** Success or failure of the last product action. */
const ProductNotice = ({ notice, onDismiss }) => {
  if (!notice) return null;
  const isError = notice.tone === 'error';
  return (
    <div role={isError ? 'alert' : 'status'}
      className={`rounded-2xl p-4 flex items-start gap-3 text-sm font-bold border ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}>
      {isError ? <XCircle size={20} className="flex-shrink-0" /> : <CheckCircle size={20} className="flex-shrink-0 text-green-500" />}
      <span className="flex-grow">{notice.text}</span>
      <button onClick={onDismiss} className="text-xs font-bold opacity-60 hover:opacity-100 flex-shrink-0">Dismiss</button>
    </div>
  );
};
```

(b) Replace the `AdminDashboard` signature and its first state lines — from `const AdminDashboard = ({ products, setProducts, onLogout }) => {` through `const [addError, setAddError]     = useState('');` — with:

```jsx
const AdminDashboard = ({ adminProducts, catalogueStatus, onRetryCatalogue, catalogueActions, onLogout }) => {
  const [tab, setTab]               = useState('overview');
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formState, setFormState]   = useState(null);
  const [editError, setEditError]   = useState('');
  const [addForm, setAddForm]       = useState(EMPTY_PRODUCT_FORM);
  const [addError, setAddError]     = useState('');
  const [productNotice, setProductNotice] = useState(null); // { tone: 'success' | 'error', text }
  const [busyProduct, setBusyProduct] = useState('');       // id being saved, or 'new'
```

(c) Replace the `// ── Product helpers` block — from `const startEdit   = (p) => {` through the end of `handleAdd` (the line `setTimeout(() => setAddSuccess(false), 3000);` and its closing `};`) — with:

```jsx
  // Every action saves through catalogueActions; local state changes only
  // when the save succeeded, and productNotice reports the outcome.
  const startEdit = (p) => {
    setEditingProduct(p.id);
    setEditError('');
    // Flatten the price band so it maps onto two numeric form inputs.
    setFormState({ ...p, priceMin: p.priceBand?.min ?? '', priceMax: p.priceBand?.max ?? '', tons: p.tons ?? '' });
    setTab('products');
  };

  const handleSave = async () => {
    const { ok, record, firstError } = validateProductForm(formState);
    if (!ok) { setEditError(firstError); return; }
    setEditError('');
    setBusyProduct(editingProduct);
    try {
      await catalogueActions.saveEdit(editingProduct, record);
      setProductNotice({ tone: 'success', text: `Saved “${record.title}”. It is live on the site now.` });
      setEditingProduct(null);
      setFormState(null);
    } catch (error) {
      setEditError(error.message);
    } finally {
      setBusyProduct('');
    }
  };

  const handleDelete = async (p) => {
    const question = p.isBuiltIn
      ? `Hide “${p.title}” from the live site? You can bring it back with Restore original.`
      : `Permanently delete “${p.title}”? This cannot be undone.`;
    if (!window.confirm(question)) return;
    setBusyProduct(p.id);
    try {
      if (p.isBuiltIn) await catalogueActions.hideProduct(p.id);
      else await catalogueActions.removeAddedProduct(p.id);
      setProductNotice({ tone: 'success', text: p.isBuiltIn ? `“${p.title}” is hidden from the site.` : `“${p.title}” was deleted.` });
    } catch (error) {
      setProductNotice({ tone: 'error', text: error.message });
    } finally {
      setBusyProduct('');
    }
  };

  const handleRestore = async (p) => {
    if (!window.confirm(`Restore “${p.title}” to its original details and show it on the site?`)) return;
    setBusyProduct(p.id);
    try {
      await catalogueActions.restoreOriginal(p.id);
      setProductNotice({ tone: 'success', text: `“${p.title}” is back to its original details.` });
    } catch (error) {
      setProductNotice({ tone: 'error', text: error.message });
    } finally {
      setBusyProduct('');
    }
  };

  const handleAdd = async () => {
    setAddError('');
    const { ok, record, firstError } = validateProductForm(addForm);
    if (!ok) { setAddError(firstError); return; }
    setBusyProduct('new');
    try {
      const { id } = await catalogueActions.addProduct(record);
      setAddForm(EMPTY_PRODUCT_FORM);
      setProductNotice({ tone: 'success', text: `Published “${record.title}”. It is live now at /product/${id}.` });
    } catch (error) {
      setAddError(error.message);
    } finally {
      setBusyProduct('');
    }
  };
```

(d) In `// ── Derived data`, replace the `filteredProducts` declaration and the three `…Count` lines with:

```jsx
  const liveProducts = adminProducts.filter(p => !p.isHidden);
  const filteredProducts = adminProducts.filter(p => {
    const matchCat  = catFilter === 'all' || p.category === catFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
```

and keep `newLeads` / `doneLeads`, then add:

```jsx
  const acCount     = liveProducts.filter(p => p.category === 'smart-acs').length;
  const purCount    = liveProducts.filter(p => p.category === 'air-purifiers').length;
  const thermoCount = liveProducts.filter(p => p.category === 'smart-thermostats').length;
```

(e) Overview: change `{ label: 'Total Products',    value: products.length,` to `{ label: 'Total Products',    value: liveProducts.length,`; in the Product Breakdown rows change each `total: products.length` to `total: liveProducts.length || 1`. In Quick Actions change `Preview a new listing (not saved)` to `Publish a new product` and `Preview edits (not saved)` to `Edit, hide or restore listings`.

(f) Products tab: change `{tab === 'products' && !editingProduct && (` block's subtitle line to:

```jsx
                <p className="text-slate-400 text-sm mt-0.5">{filteredProducts.length} of {adminProducts.length} products shown · changes go live immediately</p>
```

replace its `<SessionOnlyNotice />` with `<ProductNotice notice={productNotice} onDismiss={() => setProductNotice(null)} />`, then gate the filters and the table. Insert these two lines immediately above the line `{/* Filters */}`:

```jsx
            <CatalogueGate status={catalogueStatus} onRetry={onRetryCatalogue}>
              <>
```

and these two lines immediately after the product-list container's closing `</div>` — the one that follows `{filteredProducts.length === 0 && ( … No products match your search … )}` — so they sit just before the products tab's own closing `</div>`:

```jsx
              </>
            </CatalogueGate>
```

Everything between those insertions (the filters row and the table) is unchanged apart from the row edits below.

In the table row, change `<tr key={p.id} className={\`border-b last:border-0 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}\`}>` to:

```jsx
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'} ${p.isHidden ? 'opacity-60' : ''}`}>
```

replace `<div className="text-xs text-blue-500 font-bold">{p.brand}</div>` with:

```jsx
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-blue-500 font-bold">{p.brand}</span>
                              {p.isHidden && <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Hidden</span>}
                              {p.isEdited && <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Edited</span>}
                              {!p.isBuiltIn && <span className="text-[9px] font-black uppercase tracking-widest bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">Added</span>}
                            </div>
```

and replace the two action buttons (`startEdit(p)` and `handleDelete(p.id)`) with:

```jsx
                          <button onClick={() => startEdit(p)} disabled={busyProduct === p.id} className="bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 p-2 rounded-lg transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          {!p.isHidden && (
                            <button onClick={() => handleDelete(p)} disabled={busyProduct === p.id} className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-500 p-2 rounded-lg transition-colors" title={p.isBuiltIn ? 'Hide from site' : 'Delete'}>
                              <Trash2 size={16} />
                            </button>
                          )}
                          {p.isBuiltIn && (p.isEdited || p.isHidden) && (
                            <button onClick={() => handleRestore(p)} disabled={busyProduct === p.id} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 p-2 rounded-lg transition-colors" title="Restore original">
                              <RotateCcw size={16} />
                            </button>
                          )}
```

(g) Edit form: wrap the edit form's white card (`<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">` through its closing `</div>`) in `<CatalogueGate status={catalogueStatus} onRetry={onRetryCatalogue}> … </CatalogueGate>`; replace its `<SessionOnlyNotice />` with nothing; replace the Image URL field block (`<label className={labelCls}>Image URL</label>` … the preview `<img …/>` line) with:

```jsx
                  <ImageLinkField id="edit-image" value={formState.image || ''} onChange={(image) => setFormState({ ...formState, image })} inputClassName={inputCls} labelClassName={labelCls} />
```

insert immediately above `<div className="flex gap-3 mt-6">` of the edit form:

```jsx
              {editError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-bold" role="alert">{editError}</div>
              )}
```

and change the save button to:

```jsx
                <button onClick={handleSave} disabled={busyProduct === editingProduct} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Save size={16} /> {busyProduct === editingProduct ? 'Saving…' : 'Save Changes'}
                </button>
```

(h) Add tab: change the subtitle to `Publish a new product to the live site`; replace `<SessionOnlyNotice />` and the `{addSuccess && ( … )}` block with `<ProductNotice notice={productNotice} onDismiss={() => setProductNotice(null)} />`; wrap the form card in `<CatalogueGate status={catalogueStatus} onRetry={onRetryCatalogue}> … </CatalogueGate>`; replace the Product Image URL field block with:

```jsx
                  <ImageLinkField id="add-image" value={addForm.image} onChange={(image) => setAddForm({ ...addForm, image })} inputClassName={inputCls} labelClassName={labelCls} />
```

and change the publish button to:

```jsx
                <button onClick={handleAdd} disabled={busyProduct === 'new' || !addForm.title || !addForm.priceMin || !addForm.priceMax}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Plus size={16} /> {busyProduct === 'new' ? 'Publishing…' : 'Publish Product'}
                </button>
```

(i) Verify no stale references remain: `grep -n "SessionOnlyNotice\|setProducts\|addSuccess\|initialProducts" src/App.jsx` → no output.

- [ ] **Step 6: Build, lint, and run the checks to verify they pass**

Run: `npm run build` → `✓ built`. Run: `npm run lint` → **10 problems** (the unused-`useMemo` error is gone; anything above 11 — e.g. `no-undef` for a missed `products` reference — must be fixed). Run: `npm run check-catalogue` → passes. Restart the preview server, then `npm run check-site` → `✅ Site checks passed.`, including the three product-state lines.

- [ ] **Step 7: Document the behaviour in `CLAUDE.md`**

In the Commands block, after `check-rules`, add:

```
npm run check-site       # Headless crawl of a served build (or BASE=https://coollivinguae.com): SEO, images, product states
```

Append to the SEO bullet that begins `- The 404, admin, installation, and unknown product/category views pass \`noIndex\`.`:

```
  A product id missing from the list while the catalogue read is in flight renders "Loading…"
  without `noindex` — it may be an admin-added product — then "Product not found" (or "Product
  unavailable" if the read failed), both `noindex`.
```

In "Admin access", replace the paragraph that begins `The dashboard's product editor changes React state only` with:

```
The dashboard's product editor saves to `catalogue/overrides` (see "Catalogue overrides"), and
changes are live immediately. The product tabs stay locked until the overrides have loaded: a form
opened earlier would show original values, and saving it would discard earlier changes. Delete
hides a built-in product (Restore original brings it back) and permanently removes an added one.
```

- [ ] **Step 8: Commit**

```bash
git add scripts/check-site.mjs src/components/ImageLinkField.jsx src/App.jsx package.json CLAUDE.md
git commit -F - <<'EOF'
feat: admin product editor saves to the live catalogue

The dashboard's Add, Edit and Delete now save to catalogue/overrides and
go live for every visitor at once; Restore original undoes changes to a
built-in product, including hiding it. Photo links get a live preview and
a warning when a link is not an image. The product tabs stay locked until
the saved changes have loaded, so a stale form cannot overwrite them.

Visitors see the built-in catalogue immediately and the overrides a
moment later. A product page for an unknown id waits in "Loading…"
without noindex until the read finishes, then shows not-found or, if the
read failed, "Product unavailable" — both noindex. npm run check-site
failed on those two states before this change and passes after.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Leads — delete, load on open, bounded, visible errors

**Files:**
- Modify: `src/App.jsx` — `AdminDashboard` leads state, effect, `markLeadStatus`, leads tab, overview's recent leads
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: Firestore `deleteDoc`, `updateDoc`, `getDocs`, `query`, `orderBy`, `fsLimit` (already imported in `App.jsx`). `firestore.rules` already allows `update, delete` on `installationRequests` for the admin only — no rules change.
- Produces: nothing used elsewhere.

- [ ] **Step 1: Replace the leads state and loading**

Above `const AdminDashboard`, add:

```jsx
/** Leads shown in the dashboard: the most recent this many. */
const LEADS_LIMIT = 200;
```

In `AdminDashboard`, replace the three lines

```jsx
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
```

with:

```jsx
  // null = not loaded yet; an array = loaded (possibly empty).
  const [leads, setLeads]           = useState(null);
  const [leadsError, setLeadsError] = useState('');
  const [leadsReloadKey, setLeadsReloadKey] = useState(0);
  const leadsLoading = leads === null;
  const leadList = leads || [];
```

Replace the whole `// ── Fetch leads from Firebase` effect and `markLeadStatus` with:

```jsx
  // ── Fetch leads from Firebase ──────────────────────────────────────────
  // Loaded when the dashboard opens, not when the Leads tab is first opened:
  // the Overview's counts and the tab badge read this list, and previously
  // showed 0 new leads until the tab had been visited. Bounded to the most
  // recent LEADS_LIMIT.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'installationRequests'), orderBy('createdAt', 'desc'), fsLimit(LEADS_LIMIT)));
        if (cancelled) return;
        setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLeadsError('');
      } catch {
        if (cancelled) return;
        setLeads([]);
        setLeadsError('Could not load leads. Check your connection and press Refresh.');
      }
    })();
    return () => { cancelled = true; };
  }, [leadsReloadKey]);

  const reloadLeads = () => { setLeads(null); setLeadsReloadKey(k => k + 1); };

  const markLeadStatus = async (leadId, status) => {
    setSavingLead(leadId);
    try {
      await updateDoc(doc(db, 'installationRequests', leadId), { status, updatedAt: serverTimestamp() });
      setLeads(prev => (prev || []).map(l => l.id === leadId ? { ...l, status } : l));
      setLeadsError('');
    } catch {
      setLeadsError('Could not update that lead. Please try again.');
    }
    setSavingLead('');
  };

  // Deletes the customer's name and phone number for good. The privacy policy
  // promises deletion on request, and old leads should not be kept forever.
  const deleteLead = async (lead) => {
    const who = lead.name ? `the request from ${lead.name}` : 'this request';
    if (!window.confirm(`Permanently delete ${who}? Their name and phone number are removed, and this cannot be undone.`)) return;
    setSavingLead(lead.id);
    try {
      await deleteDoc(doc(db, 'installationRequests', lead.id));
      setLeads(prev => (prev || []).filter(l => l.id !== lead.id));
      setLeadsError('');
    } catch {
      setLeadsError('Could not delete that lead. Please try again.');
    }
    setSavingLead('');
  };
```

- [ ] **Step 2: Use `leadList` wherever the array is read**

Change `const newLeads    = leads.filter(` to `const newLeads    = leadList.filter(`, `const doneLeads   = leads.filter(` to `const doneLeads   = leadList.filter(`, the Overview stat `value: leads.length` to `value: leadList.length`, `{leads.length > 0 && (` (Recent Leads) to `{leadList.length > 0 && (`, `{leads.slice(0, 4).map(` to `{leadList.slice(0, 4).map(`, `!leadsLoading && !leadsError && leads.length === 0` to `!leadsLoading && !leadsError && leadList.length === 0`, and `{!leadsLoading && leads.map(lead => (` to `{!leadsLoading && leadList.map(lead => (`.

- [ ] **Step 3: Add Refresh, the limit note, and the Delete button**

In the leads tab header, replace `<div className="flex gap-3">` (the one holding the New/Closed counters) with:

```jsx
              <div className="flex gap-3 items-center">
                <button onClick={reloadLeads} disabled={leadsLoading} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 font-bold px-4 py-2 rounded-full text-xs transition-all">
                  {leadsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
```

Immediately after the `{leadsError && ( … )}` block, add:

```jsx
            {!leadsLoading && leadList.length >= LEADS_LIMIT && (
              <p className="text-xs text-slate-400 font-bold">Showing the {LEADS_LIMIT} most recent leads.</p>
            )}
```

In each lead card, change `<div className="flex gap-2 pt-2">` to `<div className="flex flex-wrap gap-2 pt-2">`, and after the `{lead.phone && ( … Call … )}` block add:

```jsx
                    <button onClick={() => deleteLead(lead)} disabled={savingLead === lead.id}
                      className="px-4 py-2.5 rounded-xl text-xs font-black border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all flex items-center gap-1">
                      <Trash2 size={13} /> Delete
                    </button>
```

- [ ] **Step 4: Build and lint**

Run: `grep -n "setLeadsLoading\|leads\.\(filter\|map\|slice\|length\)" src/App.jsx` → no output.
Run: `npm run build` → `✓ built`. Run: `npm run lint` → **9 problems** (the synchronous-setState error in the old leads effect is gone).

- [ ] **Step 5: Document and commit**

In `CLAUDE.md`, replace `Firestore list queries must stay bounded. \`fetchApprovedReviews()\` caps at 50. The admin leads
query is still unbounded (known issue).` with:

```
Firestore list queries must stay bounded. `fetchApprovedReviews()` caps at 50, and the dashboard
loads the 200 most recent leads when it opens. Leads can be deleted from the dashboard — the
privacy policy promises deletion on request.
```

```bash
git add src/App.jsx CLAUDE.md
git commit -F - <<'EOF'
feat: delete installation leads from the dashboard

Each lead now has a Delete button (with confirmation), which removes the
customer's name and phone number for good — the privacy policy promises
deletion on request. Leads load when the dashboard opens, so the
Overview's new-lead count is right without visiting the Leads tab first;
the query is bounded to the 200 most recent, with a Refresh button. A
failed status change or delete now shows an error instead of failing
silently.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Release

**Files:**
- Modify: `CLAUDE.md` (lint baseline)

- [ ] **Step 1: Full local verification**

Run, in order, and read every output:
- `npm run check-images -- --network` → `✅ Product images OK.`
- `npm run check-catalogue` → `✅ Catalogue rules OK.`
- `npm run check-rules` → `✅ Live rules behave as firestore.rules says.`
- `npm run build` → `✓ built`
- `npm run lint` → 9 problems
- Restart `npx vite preview --port 4173 --strictPort`; `npm run check-site` → `✅ Site checks passed.`

- [ ] **Step 2: Update the lint baseline**

In `CLAUDE.md`, under "Lint baseline", change both `11` occurrences to the count just measured (expected `9`). Commit:

```bash
git add CLAUDE.md
git commit -m "docs: lint baseline after the catalogue release" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push and wait for the deploy**

Run: `git push origin main`. Then run this as a background command (one completion notice); it exits 0 once the live page serves the bundle just built, or 1 after 10 minutes:

```bash
want=$(grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' dist/index.html); live=''
for i in $(seq 1 60); do
  live=$(curl -s --max-time 15 "https://coollivinguae.com/?deploy-check=$i" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' || true)
  if [ "$live" = "$want" ]; then echo "LIVE: $live"; exit 0; fi
  sleep 10
done
echo "NOT LIVE after 10 minutes (live: $live, built: $want)"; exit 1
```

- [ ] **Step 4: Verify the live site**

Run: `BASE=https://coollivinguae.com npm run check-site` → `✅ Site checks passed.` Run: `npm run check-rules` → passes.

- [ ] **Step 5: Owner acceptance test**

Ask the owner to:
1. Sign in through the footer `©` → Products: no "Preview only" notice; list loads.
2. Edit one product, paste a manufacturer photo link, confirm the preview, Save → "Saved … live on the site now".
3. Open that product on a phone (or private window) → the photo shows. Reload the dashboard → the change is still there, labelled "Edited".
4. Add Product with a test title → "Published … /product/<id>"; open that address on the phone.
5. Delete the test product; Hide one built-in, then Restore original.
6. Leads → Delete a test lead (submit one first from the phone if none exists).

Record the outcome; anything failing returns to the owning task.
