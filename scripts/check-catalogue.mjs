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
  let map = applyEdit({}, builtInsById, 'ac-1', { ...ac1, image: 'https://example.com/a.jpg' }, undefined);
  assert.deepEqual(map, { 'ac-1': { image: 'https://example.com/a.jpg' } });
  map = applyEdit(map, builtInsById, 'ac-1', { ...ac1 }, map['ac-1']);
  assert.deepEqual(map, {});
});

check('applyEdit keeps a hidden flag set by another tab and never mutates its input', () => {
  const current = { 'ac-1': { hidden: true } };
  const map = applyEdit(current, builtInsById, 'ac-1', { ...ac1, image: 'https://example.com/a.jpg' }, undefined);
  assert.deepEqual(map['ac-1'], { image: 'https://example.com/a.jpg', hidden: true });
  assert.deepEqual(applyEdit(map, builtInsById, 'ac-1', { ...ac1 }, map['ac-1'])['ac-1'], { hidden: true });
  assert.deepEqual(current, { 'ac-1': { hidden: true } });
});

check('applyEdit replaces an added product, keeps addedAt, and rejects unknown ids', () => {
  const map = applyEdit({ 'lg-artcool-aaaa': VALID_NEW }, builtInsById, 'lg-artcool-aaaa', { ...VALID_NEW, addedAt: undefined, title: 'LG ArtCool Renamed' }, VALID_NEW);
  assert.equal(map['lg-artcool-aaaa'].title, 'LG ArtCool Renamed');
  assert.equal(map['lg-artcool-aaaa'].addedAt, 1000);
  assert.throws(() => applyEdit({}, builtInsById, 'gone-aaaa', VALID_NEW, VALID_NEW), /no longer exists/);
});

check('applyEdit refuses an edit when another device changed the product after the form opened', () => {
  // A laptop opened the form while nothing was stored for ac-4; a phone then saved a photo.
  const current = { 'ac-4': { image: 'https://example.com/phone.jpg' } };
  const laptopEdit = { ...builtInsById.get('ac-4'), description: 'x'.repeat(50) };
  assert.throws(
    () => applyEdit(current, builtInsById, 'ac-4', laptopEdit, null),
    (error) => error instanceof CatalogueError && /changed on another device/.test(error.message),
  );
  assert.deepEqual(current, { 'ac-4': { image: 'https://example.com/phone.jpg' } });
});

check('applyEdit accepts an edit when the stored entry is unchanged since the form opened', () => {
  const stored = { 'ac-4': { image: 'https://example.com/phone.jpg' } };
  const edited = { ...builtInsById.get('ac-4'), image: 'https://example.com/phone.jpg', description: 'y'.repeat(50) };
  const map = applyEdit(stored, builtInsById, 'ac-4', edited, stored['ac-4']);
  assert.deepEqual(map['ac-4'], { image: 'https://example.com/phone.jpg', description: 'y'.repeat(50) });
});

check('a hide from another device is not treated as a conflicting edit', () => {
  const map = applyEdit({ 'ac-1': { hidden: true } }, builtInsById, 'ac-1', { ...ac1, image: 'https://example.com/a.jpg' }, null);
  assert.deepEqual(map['ac-1'], { image: 'https://example.com/a.jpg', hidden: true });
});

check('applyEdit refuses a stale edit to an added product', () => {
  const current = { 'lg-artcool-aaaa': { ...VALID_NEW, image: 'https://example.com/changed.jpg' } };
  assert.throws(
    () => applyEdit(current, builtInsById, 'lg-artcool-aaaa', { ...VALID_NEW, title: 'Renamed on the laptop' }, VALID_NEW),
    CatalogueError,
  );
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
