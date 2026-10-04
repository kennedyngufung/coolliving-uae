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
