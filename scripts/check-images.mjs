/**
 * CoolLivingUAE — Product image integrity check
 * ---------------------------------------------------------------------------
 * Run:  npm run check-images                 offline checks only
 *       npm run check-images -- --network    also fetches every remote image
 *
 * Why this exists: product pages previously showed photos of the wrong brand
 * and the wrong kind of product — a Samsung air conditioner on thermostat and
 * air purifier pages, a vacuum cleaner on the Panasonic AC review. Images had
 * been copied between catalogue entries, 26 of 36 remote image URLs no longer
 * resolved, and a hardcoded fallback photo replaced every image that failed.
 *
 * Checks:
 *   1. Every image is '' (no photo), a site path ("/images/..."), or an
 *      https:// URL.
 *   2. Every site path exists under public/.
 *   3. No image is shared by two different brands or two different product
 *      categories. Reusing a photo across capacities of the same brand is
 *      fine; borrowing another brand's photo is a misrepresentation.
 *   4. With --network, every remote image answers HTTP 200 with an image
 *      content type.
 *
 * What it cannot check: whether a photo actually depicts the brand it is
 * attached to. That needs a human looking at the picture before it is added.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products } from '../src/data/products.js';
import { uaeACDatabase } from '../src/data/calculatorAcs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CHECK_NETWORK = process.argv.includes('--network');
const FETCH_TIMEOUT_MS = 20000;

const entries = [
  ...products.map((p) => ({
    source: `products.js ${p.id}`,
    brand: p.brand,
    category: p.category,
    image: p.image,
  })),
  ...uaeACDatabase.map((ac) => ({
    source: `calculatorAcs.js ${ac.id}`,
    brand: ac.brand,
    category: 'smart-acs',
    image: ac.img,
  })),
];

const errors = [];

// ── 1 & 2: format, and local files exist ────────────────────────────────────
for (const { source, image } of entries) {
  if (image === '' ) continue;
  if (typeof image !== 'string') {
    errors.push(`${source}: image must be a string ('' for no photo), got ${typeof image}`);
    continue;
  }
  if (image.startsWith('/')) {
    const file = path.join(PUBLIC_DIR, ...image.split('/').filter(Boolean));
    if (!fs.existsSync(file)) errors.push(`${source}: ${image} does not exist in public/`);
  } else if (!image.startsWith('https://')) {
    errors.push(`${source}: image must be a site path or an https URL, got "${image}"`);
  }
}

// ── 3: no sharing across brands or categories ────────────────────────────────
const byImage = new Map();
for (const entry of entries) {
  if (!entry.image) continue;
  if (!byImage.has(entry.image)) byImage.set(entry.image, []);
  byImage.get(entry.image).push(entry);
}

for (const [image, users] of byImage) {
  const brands = new Set(users.map((u) => u.brand.trim().toLowerCase()));
  const categories = new Set(users.map((u) => u.category));
  if (brands.size > 1 || categories.size > 1) {
    const who = users.map((u) => `${u.source} (${u.brand}, ${u.category})`).join('; ');
    errors.push(`${image} is shared across ${brands.size > 1 ? 'brands' : 'categories'}: ${who}`);
  }
}

// ── 4: remote images resolve ────────────────────────────────────────────────
async function checkRemote(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const type = res.headers.get('content-type') || '';
    // Drain the body so the connection is released promptly.
    await res.arrayBuffer();
    if (res.status !== 200) return `HTTP ${res.status}`;
    if (!type.startsWith('image/')) return `content type "${type}", not an image`;
    return null;
  } catch (err) {
    return err.name === 'TimeoutError' ? `timed out after ${FETCH_TIMEOUT_MS / 1000}s` : err.message;
  }
}

if (CHECK_NETWORK) {
  const remote = [...byImage.keys()].filter((image) => image.startsWith('https://'));
  const results = await Promise.all(remote.map(async (url) => [url, await checkRemote(url)]));
  for (const [url, problem] of results) {
    if (!problem) continue;
    const who = byImage.get(url).map((u) => u.source).join(', ');
    errors.push(`${url} — ${problem} (used by ${who})`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const withPhoto = entries.filter((e) => e.image).length;
console.log(
  `Checked ${entries.length} catalogue entries: ${withPhoto} with a photo, ` +
  `${entries.length - withPhoto} without${CHECK_NETWORK ? '' : ' (remote URLs not fetched; add --network)'}.`
);

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} image problem${errors.length === 1 ? '' : 's'}:`);
  for (const message of errors) console.error(`   - ${message}`);
  process.exit(1);
}

console.log('✅ Product images OK.');
