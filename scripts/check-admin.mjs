/**
 * CoolLivingUAE — Admin dashboard check
 * ---------------------------------------------------------------------------
 * Run: npm run check-admin
 *
 * Drives the real admin dashboard in headless Chrome, the way the owner uses
 * it: open a product, change it, save; fill in Add Product, publish. Vite
 * serves the app with firebase/app, firebase/auth and firebase/firestore
 * swapped for the in-memory fakes in scripts/admin-fakes/, and every request
 * that is not to the local server is blocked, so nothing reaches the real
 * Firebase project. The fakes sign in automatically; the security rules are
 * checked against the live project by scripts/check-rules.mjs instead.
 * ---------------------------------------------------------------------------
 */

import { fileURLToPath } from 'url';
import { isDeepStrictEqual } from 'util';
import puppeteer from 'puppeteer';
import { createServer } from 'vite';
import { products as builtIns } from '../src/data/products.js';

const fake = (name) => fileURLToPath(new URL(`./admin-fakes/${name}.js`, import.meta.url));
const AC1 = builtIns.find((p) => p.id === 'ac-1');
// Real site photos, so the photo preview loads and shows no warning.
const SAVED_EARLIER = { image: builtIns.find((p) => p.id === 'ac-2').image };
const OTHER_DEVICE = { image: builtIns.find((p) => p.id === 'ac-3').image };
const NEW_DESCRIPTION = 'Description changed by the admin check, long enough to pass validation.';
const NEW_PRODUCT = {
  title: 'Admin check test AC 1.5 ton',
  brand: 'CheckBrand',
  amazonQuery: 'test brand 1.5 ton inverter split AC UAE',
  description: 'A product added by the admin check. Long enough to pass validation.',
};
const overridesWith = (products) => ({ 'catalogue/overrides': { products, updatedAt: null } });

const failures = [];
function report(ok, label, detail = '') {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail && !ok ? `  ${detail}` : ''}`);
  if (!ok) failures.push(label);
}

const server = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
  cacheDir: 'node_modules/.vite-check-admin',
  logLevel: 'error',
  server: { port: 5199, strictPort: false, open: false },
  resolve: {
    alias: [
      { find: /^firebase\/app$/, replacement: fake('app') },
      { find: /^firebase\/auth$/, replacement: fake('auth') },
      { find: /^firebase\/firestore$/, replacement: fake('firestore') },
    ],
  },
});
await server.listen();
const ORIGIN = new URL(server.resolvedUrls.local[0]).origin;
const browser = await puppeteer.launch({ headless: true });

/** A fresh page on the dashboard, its fake Firestore seeded with `documents`. */
async function openDashboard(documents) {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().startsWith(ORIGIN)) request.continue();
    else request.abort();
  });
  page.on('pageerror', (error) => failures.push(`uncaught error in the page: ${error.message}`));
  page.on('dialog', (dialog) => dialog.accept());
  await page.evaluateOnNewDocument((seed) => { window.__seedDocuments = seed; }, documents);
  // Generous: the first load after a dependency change waits for Vite to
  // pre-bundle react and lucide-react, which has taken over 30 s.
  await page.goto(`${ORIGIN}/admin`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  await page.waitForFunction(() => document.body.textContent.includes('Admin Dashboard'), { timeout: 60_000 });
  return page;
}

async function clickButton(page, label) {
  const found = await page.evaluate((text) => {
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
    button?.click();
    return Boolean(button);
  }, label);
  if (!found) throw new Error(`no button labelled "${label}"`);
}

async function openEdit(page, title) {
  await clickButton(page, 'Products');
  await page.evaluate((text) => {
    const row = [...document.querySelectorAll('tr')]
      .find((tr) => [...tr.querySelectorAll('div')].some((div) => div.textContent === text));
    row.querySelector('button[title="Edit"]').click();
  }, title);
  await page.waitForFunction(() => document.body.textContent.includes('Edit Product'));
}

/** Replaces a field's contents by typing, as a person would. */
async function typeInto(page, selector, text) {
  await page.click(selector);
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type(selector, text);
}

/** True once an element matching `selector` shows text matching `pattern`. */
async function shows(page, selector, pattern) {
  try {
    await page.waitForFunction(
      (sel, source) => [...document.querySelectorAll(sel)].some((el) => new RegExp(source).test(el.textContent)),
      { timeout: 15_000 }, selector, pattern.source,
    );
    return true;
  } catch {
    return false;
  }
}

const storedProducts = (page) => page.evaluate(() => window.__firestore.get('catalogue/overrides')?.products);
const alertText = (page) => page.evaluate(() => [...document.querySelectorAll('[role="alert"]')].map((el) => el.textContent).join(' | ') || 'no message shown');

const PRICE_MIN_FIELD = 'input[placeholder="e.g. 1750"]';

async function fillAddForm(page, priceMin) {
  await clickButton(page, 'Add Product');
  await typeInto(page, 'input[placeholder="e.g. LG DualCool 1.5 Ton T3 Inverter Split AC"]', NEW_PRODUCT.title);
  await typeInto(page, 'input[placeholder="e.g. LG"]', NEW_PRODUCT.brand);
  await typeInto(page, PRICE_MIN_FIELD, priceMin);
  await typeInto(page, 'input[placeholder="e.g. 2200"]', '2800');
  await typeInto(page, 'input[placeholder="e.g. LG DualCool 1.5 ton inverter split AC UAE"]', NEW_PRODUCT.amazonQuery);
  await typeInto(page, 'textarea', NEW_PRODUCT.description);
}

try {
  console.log(`Admin dashboard at ${ORIGIN}/admin (fake Firebase):`);

  {
    const page = await openDashboard(overridesWith({ 'ac-1': SAVED_EARLIER }));
    await openEdit(page, AC1.title);
    await typeInto(page, 'textarea', NEW_DESCRIPTION);
    await clickButton(page, 'Save Changes');
    const saved = await shows(page, '[role="status"]', /^Saved/);
    const stored = (await storedProducts(page))?.['ac-1'];
    report(saved && isDeepStrictEqual(stored, { ...SAVED_EARLIER, description: NEW_DESCRIPTION }),
      'editing a product that already has saved changes saves the edit',
      saved ? `stored: ${JSON.stringify(stored)}` : await alertText(page));
    await page.close();
  }

  {
    const page = await openDashboard(overridesWith({ 'ac-1': SAVED_EARLIER }));
    await openEdit(page, AC1.title);
    await page.evaluate((entry) => {
      const document = window.__firestore.get('catalogue/overrides');
      document.products['ac-1'] = entry;
      window.__firestore.set('catalogue/overrides', document);
    }, OTHER_DEVICE);
    await typeInto(page, 'textarea', NEW_DESCRIPTION);
    await clickButton(page, 'Save Changes');
    const refused = await shows(page, '[role="alert"]', /changed on another device/);
    const stored = (await storedProducts(page))?.['ac-1'];
    report(refused && isDeepStrictEqual(stored, OTHER_DEVICE),
      'an edit is refused when another device saved the product after the form opened',
      `message: ${await alertText(page)}; stored: ${JSON.stringify(stored)}`);
    await page.close();
  }

  {
    // A number box holding text the browser cannot read as a number reports
    // its value as empty. Safari and Firefox do this for "2,300"; Chrome drops
    // the comma, so a range typed into one box stands in for it here.
    const page = await openDashboard({});
    await fillAddForm(page, '2300-2800');
    const field = await page.$eval(PRICE_MIN_FIELD, (el) => ({ value: el.value, unreadable: el.validity.badInput }));
    await clickButton(page, 'Publish Product');
    const told = await shows(page, '[role="alert"]', /whole dirhams/);
    const stored = await storedProducts(page);
    report(field.unreadable && told && stored === undefined,
      'Publish with a price the browser cannot read says what to fix and saves nothing',
      `field: ${JSON.stringify(field)}; message: ${await alertText(page)}; stored: ${JSON.stringify(stored)}`);
    await page.close();
  }

  {
    const page = await openDashboard({});
    await fillAddForm(page, '2300');
    await clickButton(page, 'Publish Product');
    const published = await shows(page, '[role="status"]', /^Published/);
    const added = Object.values((await storedProducts(page)) || {}).find((entry) => entry.title === NEW_PRODUCT.title);
    report(published && isDeepStrictEqual(added?.priceBand, { min: 2300, max: 2800 }),
      'Publish with valid details adds the product',
      published ? `stored: ${JSON.stringify(added)}` : await alertText(page));
    await page.close();
  }
} catch (error) {
  failures.push(`the check could not run: ${error.message}`);
} finally {
  await browser.close();
  await server.close();
}

if (failures.length > 0) {
  console.error(`\n❌ ${failures.length} admin check(s) failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
console.log('\n✅ Admin dashboard checks passed.');
