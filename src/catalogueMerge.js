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
