/**
 * CoolLivingUAE — Sitemap Generator
 * ---------------------------------------------------------------------------
 * Run: node scripts/generate-sitemap.mjs
 * Output: public/sitemap.xml  (committed to repo so it's in every build)
 *
 * A sitemap tells Googlebot exactly which URLs to crawl and how often they
 * change. Without one, Google may miss pages in a React SPA. This script
 * generates both the sitemap.xml AND the robots.txt to reference it.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/data/products.js';
import { crawlablePaths, pathToRoute } from '../src/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL  = 'https://coollivinguae.com';
const NOW       = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Crawl metadata ───────────────────────────────────────────────────────────
// priority: 1.0 = most important, 0.1 = least
// changefreq: always | hourly | daily | weekly | monthly | yearly | never
const META = {
  '/':           { changefreq: 'daily',   priority: '1.0' },
  '/guides':     { changefreq: 'weekly',  priority: '0.9' },
  '/calculator': { changefreq: 'monthly', priority: '0.9' },
  '/reviews':    { changefreq: 'weekly',  priority: '0.8' },
  '/contact':    { changefreq: 'monthly', priority: '0.6' },
  '/privacy':    { changefreq: 'yearly',  priority: '0.3' },
  '/cookies':    { changefreq: 'yearly',  priority: '0.3' },
  '/terms':      { changefreq: 'yearly',  priority: '0.3' },
  '/affiliate':  { changefreq: 'yearly',  priority: '0.3' },
  '/security':   { changefreq: 'yearly',  priority: '0.3' },
};

const CATEGORY_META = { changefreq: 'weekly',  priority: '0.9' };
const PRODUCT_META  = { changefreq: 'monthly', priority: '0.7' };

function metaFor(loc) {
  if (META[loc]) return META[loc];
  if (loc.startsWith('/category/')) return CATEGORY_META;
  if (loc.startsWith('/product/')) return PRODUCT_META;
  return { changefreq: 'monthly', priority: '0.5' };
}

// URLs come from src/routes.js — the same table the application routes with.
// This is deliberate: a sitemap is a promise to Google that these URLs exist,
// and deriving it from anywhere else lets the two drift. A previous version
// hardcoded 15 products per category while 20 existed, silently omitting 15
// review pages.
const URLS = crawlablePaths(products).map((loc) => ({ loc, ...metaFor(loc) }));

// A duplicate URL wastes crawl budget and signals a data-integrity problem.
const duplicates = URLS.map((u) => u.loc).filter((loc, i, all) => all.indexOf(loc) !== i);
if (duplicates.length > 0) {
  console.error(`❌ Duplicate sitemap URLs: ${[...new Set(duplicates)].join(', ')}`);
  process.exit(1);
}

// Every advertised URL must resolve to a real page. Advertising a URL the app
// cannot serve is worse than omitting it: Google records a soft 404, and an
// affiliate programme reviewer following the link sees a broken site.
const unservable = URLS.filter(({ loc }) => pathToRoute(loc).path === 'not-found');
if (unservable.length > 0) {
  console.error(`❌ Sitemap contains URLs the app cannot serve: ${unservable.map(u => u.loc).join(', ')}`);
  process.exit(1);
}

// ── Build XML ────────────────────────────────────────────────────────────────
function buildSitemapXML(urls) {
  const entries = urls.map(({ loc, changefreq, priority }) => `
  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${NOW}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries}
</urlset>`;
}

// ── Build robots.txt ─────────────────────────────────────────────────────────
function buildRobotsTxt() {
  return `# CoolLivingUAE robots.txt
# Generated: ${NOW}

User-agent: *
Allow: /

# Disallow admin and internal paths
Disallow: /admin
Disallow: /src/
Disallow: /.git/
Disallow: /node_modules/
Disallow: /scripts/

# Sitemap location
Sitemap: ${BASE_URL}/sitemap.xml

# Crawl-delay for polite bots (Google ignores this, but others respect it)
Crawl-delay: 1
`;
}

// ── Write files ──────────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
const robotsPath  = path.join(PUBLIC_DIR, 'robots.txt');

fs.writeFileSync(sitemapPath, buildSitemapXML(URLS), 'utf-8');
console.log(`✅ sitemap.xml written → ${sitemapPath} (${URLS.length} URLs)`);

fs.writeFileSync(robotsPath, buildRobotsTxt(), 'utf-8');
console.log(`✅ robots.txt written  → ${robotsPath}`);

console.log('\n📋 Next steps:');
console.log('   1. Commit public/sitemap.xml and public/robots.txt to your repo');
console.log('   2. After deploying, submit https://coollivinguae.com/sitemap.xml');
console.log('      to Google Search Console → Sitemaps section');
console.log('   3. Verify https://coollivinguae.com/robots.txt is accessible\n');
