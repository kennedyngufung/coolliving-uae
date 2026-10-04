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

import fs from 'fs';
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

// The fields firestore.rules lets a visitor put in a lead. The form must
// never send another, or the live database refuses the request.
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const LEAD_FIELDS = rules.match(/match \/installationRequests[\s\S]*?hasOnly\(\[([\s\S]*?)\]\)/)[1].match(/'([^']+)'/g).map((f) => f.slice(1, -1));
const SEEDED_LEADS = {
  'installationRequests/lead-product': {
    name: 'Product Lead', phone: '0501234567', location: 'Dubai - Other', message: '', createdAt: null,
    productId: 'ac-1', productTitle: AC1.title,
  },
  'installationRequests/lead-general': {
    name: 'General Lead', phone: '0507654321', location: 'Abu Dhabi City', message: '', createdAt: null,
  },
};

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

/** A fresh page at `path`, its fake Firestore seeded with `documents`. */
async function openPage(path, documents) {
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
  await page.goto(`${ORIGIN}${path}`, { waitUntil: 'domcontentloaded', timeout: 180_000 });
  return page;
}

async function openDashboard(documents) {
  const page = await openPage('/admin', documents);
  await page.waitForFunction(() => document.body.textContent.includes('Admin Dashboard'), { timeout: 60_000 });
  return page;
}

/** Clicks the button whose text is `label`, or matches it when it is a RegExp. */
async function clickButton(page, label) {
  const found = await page.evaluate((text, source) => {
    const matches = (b) => (source ? new RegExp(source).test(b.textContent.trim()) : b.textContent.trim() === text);
    const button = [...document.querySelectorAll('button')].find(matches);
    button?.click();
    return Boolean(button);
  }, typeof label === 'string' ? label : '', label instanceof RegExp ? label.source : '');
  if (!found) throw new Error(`no button labelled ${label}`);
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

/** Fills in and sends the installation form; returns whether it went and every stored lead. */
async function submitLead(page) {
  await page.waitForSelector('#lead-name', { timeout: 60_000 });
  await typeInto(page, '#lead-name', 'Check Lead');
  await typeInto(page, '#lead-phone', '0501234567');
  await page.select('#lead-location', 'Dubai - Other');
  await clickButton(page, 'Submit Quote Request');
  const sent = await page.waitForFunction(() => document.body.textContent.includes('Request Submitted Successfully'), { timeout: 15_000 })
    .then(() => true, () => false);
  const leads = Object.entries(await page.evaluate(() => window.__firestore.all()))
    .filter(([path]) => path.startsWith('installationRequests/'))
    .map(([, data]) => data);
  return { sent, leads };
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

  {
    const page = await openPage(`/installation/${AC1.id}`, {});
    const { sent, leads } = await submitLead(page);
    const unexpected = Object.keys(leads[0] || {}).filter((key) => !LEAD_FIELDS.includes(key));
    report(sent && leads.length === 1 && leads[0].productId === AC1.id && leads[0].productTitle === AC1.title && unexpected.length === 0,
      'a request from a product page records which product it is for',
      `sent: ${sent}; stored: ${JSON.stringify(leads)}${unexpected.length ? `; fields firestore.rules refuses: ${unexpected.join(', ')}` : ''}`
        + (sent ? '' : `; message: ${await alertText(page)}`));
    await page.close();
  }

  {
    const page = await openPage('/installation', {});
    const { sent, leads } = await submitLead(page);
    report(sent && leads.length === 1 && !('productId' in leads[0]) && !('productTitle' in leads[0]),
      'a general request records no product',
      `sent: ${sent}; stored: ${JSON.stringify(leads)}` + (sent ? '' : `; message: ${await alertText(page)}`));
    await page.close();
  }

  {
    const page = await openDashboard(SEEDED_LEADS);
    await page.waitForFunction(() => [...document.querySelectorAll('h3')].some((h) => h.textContent.includes('Recent Leads')), { timeout: 15_000 });
    const recent = await page.evaluate(() => [...document.querySelectorAll('h3')]
      .find((h) => h.textContent.includes('Recent Leads')).closest('.rounded-2xl').textContent);
    await clickButton(page, /^Leads\d*$/);
    await page.waitForFunction(() => document.body.textContent.includes('Installation Leads'));
    const cards = await page.evaluate((id, title) => ({
      linked: [...document.querySelectorAll(`a[href="/product/${id}"]`)].some((a) => a.textContent.includes(title)),
      general: document.body.textContent.includes('General request'),
    }), AC1.id, AC1.title);
    report(recent.includes(AC1.title) && cards.linked && cards.general,
      'the dashboard names the product each lead is for',
      `overview names it: ${recent.includes(AC1.title)}; lead card links it: ${cards.linked}; general lead labelled: ${cards.general}`);
    await page.close();
  }

  {
    const page = await openDashboard({});
    const homepageSection = await page.evaluate(() => document.body.textContent.includes('Expert Home Solutions for the'));
    report(!homepageSection, 'the dashboard page shows none of the homepage sections');

    // Tailwind 4 draws a border with no colour class in the text colour.
    const border = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('header'));
      return { line: style.borderBottomColor, text: style.color };
    });
    report(border.line !== border.text, 'plain borders are light grey, not the text colour', JSON.stringify(border));

    await clickButton(page, 'Products');
    const layout = await page.evaluate(() => {
      window.scrollTo(0, 1200);
      const menuBottom = Math.round(document.querySelector('header').getBoundingClientRect().bottom);
      const place = (label) => {
        const button = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
        const r = button.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), onTop: Boolean(hit && button.contains(hit)) };
      };
      return { scrolled: window.scrollY, menuBottom, tab: place('Products'), logout: place('Logout') };
    });
    // Tabs sit fully below the site menu; Logout is either visible or scrolled
    // away — never stuck behind the menu.
    const tabClear = layout.tab.top >= layout.menuBottom && layout.tab.onTop;
    const logoutClear = layout.logout.bottom <= 0 || layout.logout.onTop;
    report(layout.scrolled > 0 && tabClear && logoutClear,
      'scrolling the dashboard never hides its header behind the site menu', JSON.stringify(layout));
    await page.close();
  }

  {
    // A phone: every tab and every product action must be reachable without
    // dragging the whole page sideways. A thumb can swipe a strip that scrolls
    // (overflow-x auto/scroll) but not one that clips (hidden/clip), so each
    // control is brought into view only that way, then must be the element a
    // tap at its centre lands on.
    const page = await openDashboard(overridesWith({ 'ac-1': SAVED_EARLIER }));
    await page.setViewport({ width: 390, height: 844 });
    await clickButton(page, 'Products');
    const phone = await page.evaluate(async () => {
      const reachable = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const overflow = getComputedStyle(a).overflowX;
          const box = a.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          if (overflow === 'auto' || overflow === 'scroll') {
            a.scrollLeft += (r.left + r.width / 2) - (box.left + box.width / 2);
            break;
          }
          if ((overflow === 'hidden' || overflow === 'clip') && (r.right > box.right + 1 || r.left < box.left - 1)) return false;
        }
        window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight / 2);
        const r = el.getBoundingClientRect();
        if (r.left < 0 || r.right > window.innerWidth) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return Boolean(hit && el.contains(hit));
      };
      const tabs = ['Overview', 'Products', 'Add Product', 'Reviews']
        .map((label) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(label)));
      const row = [...document.querySelectorAll('tr')].find((tr) => tr.querySelector('button[title="Restore original"]'));
      const actions = [...row.querySelectorAll('button')];
      return {
        pageFitsWidth: document.documentElement.scrollWidth <= window.innerWidth,
        unreachableTabs: tabs.filter((b) => !reachable(b)).map((b) => b.textContent.trim()),
        unreachableActions: actions.filter((b) => !reachable(b)).map((b) => b.title),
      };
    });
    report(phone.pageFitsWidth && phone.unreachableTabs.length === 0 && phone.unreachableActions.length === 0,
      'on a phone, every tab and product action can be reached', JSON.stringify(phone));

    const tooWide = [];
    for (const tab of [/^Overview$/, /^Leads\d*$/, /^Add Product$/, /^Reviews\d*$/]) {
      await clickButton(page, tab);
      await new Promise((resolve) => setTimeout(resolve, 300));
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      if (width > 390) tooWide.push(`${tab.source} ${width}px`);
    }
    report(tooWide.length === 0, 'on a phone, no dashboard tab is wider than the screen', tooWide.join(', '));
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
