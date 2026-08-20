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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL  = 'https://coollivinguae.com';
const NOW       = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Priority per product category. Anything not listed falls back to 0.6.
const CATEGORY_PRIORITY = {
  'smart-acs': '0.7',
  'air-purifiers': '0.6',
  'smart-thermostats': '0.6',
};

// ── Define all site URLs ─────────────────────────────────────────────────────
// priority: 1.0 = most important, 0.1 = least
// changefreq: always | hourly | daily | weekly | monthly | yearly | never
//
// Product URLs are derived from the catalogue itself rather than hardcoded
// counts. A previous version assumed 15 products per category while 20
// existed, leaving 15 review pages absent from the sitemap entirely.
const URLS = [
  // Core pages
  { loc: '/',           changefreq: 'daily',   priority: '1.0' },
  { loc: '/guides',     changefreq: 'weekly',  priority: '0.9' },
  { loc: '/reviews',    changefreq: 'weekly',  priority: '0.8' },
  { loc: '/calculator', changefreq: 'monthly', priority: '0.9' },
  { loc: '/contact',    changefreq: 'monthly', priority: '0.6' },

  // Category pages
  { loc: '/category/smart-acs',         changefreq: 'weekly', priority: '0.9' },
  { loc: '/category/air-purifiers',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/category/smart-thermostats', changefreq: 'weekly', priority: '0.8' },

  // One entry per product in the catalogue
  ...products.map((product) => ({
    loc: `/product/${product.id}`,
    changefreq: 'monthly',
    priority: CATEGORY_PRIORITY[product.category] || '0.6',
  })),

  // Legal & trust pages
  { loc: '/privacy',   changefreq: 'yearly',  priority: '0.3' },
  { loc: '/cookies',   changefreq: 'yearly',  priority: '0.3' },
  { loc: '/terms',     changefreq: 'yearly',  priority: '0.3' },
  { loc: '/affiliate', changefreq: 'yearly',  priority: '0.3' },
  { loc: '/security',  changefreq: 'yearly',  priority: '0.3' },
];

// A duplicate URL in a sitemap is a crawl-budget waste and a signal of a
// data-integrity problem upstream, so fail loudly rather than shipping one.
const duplicates = URLS.map((u) => u.loc).filter((loc, i, all) => all.indexOf(loc) !== i);
if (duplicates.length > 0) {
  console.error(`❌ Duplicate sitemap URLs: ${[...new Set(duplicates)].join(', ')}`);
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
