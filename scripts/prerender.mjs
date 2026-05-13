/**
 * CoolLivingUAE — Static Prerenderer
 * ---------------------------------------------------------------------------
 * Run AFTER `npm run build`:  node scripts/prerender.mjs
 *
 * This script launches a headless Chromium browser, visits every route of
 * the built SPA (served locally on port 4173), waits for the page to fully
 * render, then writes the HTML to the correct path inside /dist.
 *
 * Result: Googlebot sees real HTML content instead of a blank shell — which
 * is required for Google AdSense approval and strong Core Web Vitals scores.
 *
 * Usage:
 *   1. npm run build
 *   2. npx serve dist -p 4173 &   (or use `vite preview` in background)
 *   3. node scripts/prerender.mjs
 *   4. Deploy the /dist folder
 * ---------------------------------------------------------------------------
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR  = path.join(__dirname, '..', 'dist');
const BASE_URL  = 'http://localhost:4173';

// ── Routes to prerender ──────────────────────────────────────────────────────
// Add new routes here whenever a new page is added to App.jsx.
// Hash-based params (#product?id=ac-1) are not crawlable — these are the
// top-level SPA routes that Google needs to index.
const ROUTES = [
  { route: '/',            file: 'index.html' },
  { route: '/#/guides',   file: 'guides/index.html' },
  { route: '/#/reviews',  file: 'reviews/index.html' },
  { route: '/#/contact',  file: 'contact/index.html' },
  { route: '/#/privacy',  file: 'privacy/index.html' },
  { route: '/#/cookies',  file: 'cookies/index.html' },
  { route: '/#/terms',    file: 'terms/index.html' },
  { route: '/#/affiliate',file: 'affiliate/index.html' },
  { route: '/#/security', file: 'security/index.html' },
  { route: '/#/calculator',file: 'calculator/index.html' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function injectPrerenderedMeta(html, route) {
  // Ensure the page has a canonical link pointing to the real URL
  const canonical = `https://coollivinguae.com${route === '/' ? '' : route.replace('/#', '')}`;
  const canonicalTag = `<link rel="canonical" href="${canonical}" />`;
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }
  // Mark as prerendered for debugging
  html = html.replace('<html', '<html data-prerendered="true"');
  return html;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function prerender() {
  console.log('🚀 CoolLivingUAE Prerenderer starting…\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let success = 0;
  let failed  = 0;

  for (const { route, file } of ROUTES) {
    const url      = `${BASE_URL}${route}`;
    const filePath = path.join(DIST_DIR, file);

    try {
      const page = await browser.newPage();

      // Block ads and analytics during prerender (not needed for static HTML)
      await page.setRequestInterception(true);
      page.on('request', req => {
        const blocklist = ['googlesyndication', 'googletagmanager', 'analytics', 'adsbygoogle'];
        if (blocklist.some(b => req.url().includes(b))) req.abort();
        else req.continue();
      });

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for React to finish rendering
      await page.waitForSelector('#root > *', { timeout: 10000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 800)); // extra settle time

      let html = await page.content();
      html = injectPrerenderedMeta(html, route);

      ensureDir(filePath);
      fs.writeFileSync(filePath, html, 'utf-8');

      console.log(`  ✅  ${route.padEnd(30)} → dist/${file}`);
      success++;
      await page.close();

    } catch (err) {
      console.error(`  ❌  ${route.padEnd(30)} FAILED: ${err.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n── Prerender complete ──`);
  console.log(`   ✅ Success: ${success}`);
  if (failed > 0) console.log(`   ❌ Failed:  ${failed}`);
  console.log(`\n📁 Output: ${DIST_DIR}`);
  console.log('📤 Ready to deploy. Upload the /dist folder to your hosting provider.\n');

  if (failed > 0) process.exit(1);
}

prerender().catch(err => {
  console.error('Fatal prerender error:', err);
  process.exit(1);
});
