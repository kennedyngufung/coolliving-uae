/**
 * CoolLivingUAE — Brand asset generator
 * ---------------------------------------------------------------------------
 * Run:  npm run generate-brand-assets
 *
 * Writes into public/:
 *   favicon.svg            vector browser-tab icon
 *   favicon.ico            16/32/48 px, for browsers and tools that ask for it
 *   apple-touch-icon.png   180 px, full-bleed (iOS rounds the corners itself)
 *   icon-192.png           Android / web app manifest
 *   icon-512.png           Android / web app manifest
 *   icon-512-maskable.png  Android adaptive icon (artwork inside the safe zone)
 *   site.webmanifest       references the icons above
 *   logo.png               full logo, for structured data and press use
 *   og-default.jpg         1200x630 link-preview image (WhatsApp, X, Facebook)
 *
 * The design is the header logo in src/App.jsx, reproduced exactly: Lucide's
 * "wind" icon at 24px inside 8px of padding, on a rounded square filled with
 * Tailwind's blue-600 → teal-500 gradient, followed by "CoolLiving" + "UAE" in
 * the site's extra-bold system font. Edit this script and re-run it rather
 * than editing the generated files by hand.
 *
 * The wordmark uses the system UI font, exactly as the live header does, so
 * the raster files take the font of the machine that generates them. The
 * committed files were generated on Windows (Segoe UI).
 * ---------------------------------------------------------------------------
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Tailwind v4 palette values (node_modules/tailwindcss/theme.css).
const COLOR = {
  blue100: 'oklch(93.2% 0.032 255.585)',
  blue600: 'oklch(54.6% 0.245 262.881)',
  blue800: 'oklch(42.4% 0.199 265.638)',
  blue900: 'oklch(37.9% 0.146 265.522)',
  gray900: 'oklch(21% 0.034 264.665)',
  teal300: 'oklch(85.5% 0.138 181.071)',
  teal400: 'oklch(77.7% 0.152 181.912)',
  teal500: 'oklch(70.4% 0.14 182.503)',
  teal800: 'oklch(43.7% 0.078 188.216)',
};

// The same stack Tailwind's font-sans resolves to on the live site.
const FONT_SANS =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

// Lucide "wind" icon, v0.575 (ISC licence) — the icon the header renders.
const WIND_PATHS = [
  'M12.8 19.6A2 2 0 1 0 14 16H2',
  'M17.5 8a2.5 2.5 0 1 1 2 4H2',
  'M9.8 4.4A2 2 0 1 1 11 8H2',
];

// The header's icon box: 24px glyph + 8px padding each side, 8px radius.
const BOX = 40;
const GLYPH = 24;
const RADIUS = 8;

/** Header gradient, exactly as Tailwind v4 emits bg-gradient-to-br. */
const BRAND_GRADIENT = `linear-gradient(to bottom right in oklab, ${COLOR.blue600}, ${COLOR.teal500})`;

function windSvg({ size, strokeWidth = 2, color = '#fff', opacity = 1 }) {
  const paths = WIND_PATHS.map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}">${paths}</svg>`;
}

/**
 * The icon box at any pixel size.
 * @param {number}  size        Edge length in px.
 * @param {boolean} fullBleed   Square corners, for platforms that mask the icon.
 * @param {number}  glyphRatio  Glyph size relative to the box (header: 24/40).
 * @param {number}  strokeWidth Glyph stroke in its 24-unit grid (header: 2).
 */
function iconBoxHtml({ size, fullBleed = false, glyphRatio = GLYPH / BOX, strokeWidth = 2 }) {
  const radius = fullBleed ? 0 : (size * RADIUS) / BOX;
  return `<div id="art" style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${BRAND_GRADIENT};display:flex;align-items:center;justify-content:center">${windSvg({ size: size * glyphRatio, strokeWidth })}</div>`;
}

function page(body, { background = 'transparent' } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:${background}}
    body{font-family:${FONT_SANS};-webkit-font-smoothing:antialiased}
  </style></head><body>${body}</body></html>`;
}

/** Renders HTML and screenshots the #art element. */
async function renderArt(browser, html, { scale = 1, type = 'png', quality } = {}) {
  const tab = await browser.newPage();
  try {
    await tab.setViewport({ width: 1400, height: 900, deviceScaleFactor: scale });
    await tab.setContent(html, { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    const art = await tab.$('#art');
    const options = { type, omitBackground: type === 'png' };
    if (type === 'jpeg') options.quality = quality ?? 90;
    return Buffer.from(await art.screenshot(options));
  } finally {
    await tab.close();
  }
}

/**
 * sRGB hex values for the vector favicon, taken from Chrome's own colour
 * conversion so the SVG matches the CSS gradient the header renders. Stops
 * are sampled along the gradient in OKLab, as Tailwind interpolates it,
 * because a plain sRGB blend between the two ends goes visibly duller.
 */
async function gradientStops(browser, count = 5) {
  const tab = await browser.newPage();
  try {
    return await tab.evaluate(([from, to, n]) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const hex = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      };
      const parse = (oklch) => {
        const [l, c, h] = oklch.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/).slice(1).map(Number);
        const rad = (h * Math.PI) / 180;
        return [l / 100, c * Math.cos(rad), c * Math.sin(rad)];
      };
      const a = parse(from);
      const b = parse(to);
      return Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const [L, A, B] = a.map((v, k) => v + (b[k] - v) * t);
        return { offset: Math.round(t * 100), color: hex(`oklab(${L} ${A} ${B})`) };
      });
    }, [COLOR.blue600, COLOR.teal500, count]);
  } finally {
    await tab.close();
  }
}

function faviconSvg(stops) {
  const stopTags = stops.map((s) => `<stop offset="${s.offset}%" stop-color="${s.color}"/>`).join('');
  const paths = WIND_PATHS.map((d) => `<path d="${d}"/>`).join('');
  // Slightly heavier stroke than the header (2.5 vs 2) so the glyph stays
  // legible at 16px in a browser tab.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}">
  <!-- CoolLivingUAE. Generated by scripts/generate-brand-assets.mjs. Wind glyph: Lucide, ISC licence. -->
  <defs><linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">${stopTags}</linearGradient></defs>
  <rect width="${BOX}" height="${BOX}" rx="${RADIUS}" fill="url(#brand)"/>
  <g transform="translate(${(BOX - GLYPH) / 2} ${(BOX - GLYPH) / 2})" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>
`;
}

/** Packs PNG frames into a .ico container (PNG-compressed entries). */
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;
  frames.forEach(({ size, png }, i) => {
    const at = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at); // width (0 means 256)
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1); // height
    directory.writeUInt8(0, at + 2); // palette colours
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...frames.map((f) => f.png)]);
}

function logoHtml({ dark = false } = {}) {
  // Mirrors the header markup: flex, gap-2, icon box, text-2xl font-extrabold
  // tracking-tight, "CoolLiving" in gray-900 and "UAE" in blue-600. The dark
  // variant swaps to white and teal-400, as the site's dark hero sections do.
  const ink = dark ? '#fff' : COLOR.gray900;
  const accent = dark ? COLOR.teal400 : COLOR.blue600;
  return `<div id="art" style="display:inline-flex;align-items:center;gap:8px;padding:8px">
    ${iconBoxHtml({ size: BOX })}
    <span style="font-size:24px;line-height:32px;font-weight:800;letter-spacing:-0.025em;color:${ink}">CoolLiving<span style="color:${accent}">UAE</span></span>
  </div>`;
}

function ogHtml() {
  return `<div id="art" style="position:relative;width:1200px;height:630px;overflow:hidden;box-sizing:border-box;padding:72px 80px;color:#fff;
      background:linear-gradient(to bottom right in oklab, ${COLOR.blue900}, ${COLOR.blue800}, ${COLOR.teal800});display:flex;flex-direction:column">
    <div style="position:absolute;top:-30px;right:-60px">${windSvg({ size: 560, opacity: 0.1 })}</div>
    <div style="display:flex;align-items:center;gap:20px">
      ${iconBoxHtml({ size: 96 })}
      <span style="font-size:60px;line-height:1;font-weight:800;letter-spacing:-0.025em">CoolLiving<span style="color:${COLOR.teal400}">UAE</span></span>
    </div>
    <div style="margin-top:auto;max-width:900px;font-size:50px;line-height:1.15;font-weight:800;letter-spacing:-0.02em">
      Independent reviews of air conditioners, air purifiers and smart thermostats for UAE homes.
    </div>
    <div style="margin-top:28px;font-size:26px;font-weight:600;color:${COLOR.blue100}">
      T3 hot-climate focus &nbsp;·&nbsp; AC size calculator &nbsp;·&nbsp; DEWA saving guides
    </div>
    <div style="margin-top:36px;font-size:26px;font-weight:700;color:${COLOR.teal300}">coollivinguae.com</div>
  </div>`;
}

function manifest() {
  return `${JSON.stringify({
    name: 'CoolLivingUAE',
    short_name: 'CoolLivingUAE',
    description: 'Independent reviews of air conditioners, air purifiers and smart thermostats for UAE homes.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2)}\n`;
}

function write(name, data) {
  fs.writeFileSync(path.join(PUBLIC_DIR, name), data);
  const bytes = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
  console.log(`  ✅ public/${name.padEnd(24)} ${(bytes / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log('🎨 Generating brand assets…\n');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const stops = await gradientStops(browser);
    write('favicon.svg', faviconSvg(stops));

    const icoFrames = [];
    for (const size of [16, 32, 48]) {
      // Thicker strokes at the smallest size keep the glyph from blurring out.
      const html = page(iconBoxHtml({ size, strokeWidth: size === 16 ? 3 : 2.5 }));
      icoFrames.push({ size, png: await renderArt(browser, html) });
    }
    write('favicon.ico', buildIco(icoFrames));

    write('apple-touch-icon.png', await renderArt(browser, page(iconBoxHtml({ size: 180, fullBleed: true }))));
    write('icon-192.png', await renderArt(browser, page(iconBoxHtml({ size: 192 }))));
    write('icon-512.png', await renderArt(browser, page(iconBoxHtml({ size: 512 }))));
    // Maskable icons are cropped to a circle as small as 80% of the edge, so
    // the glyph is kept well inside that safe zone.
    write('icon-512-maskable.png', await renderArt(browser, page(iconBoxHtml({ size: 512, fullBleed: true, glyphRatio: 0.46 }))));
    write('site.webmanifest', manifest());

    write('logo.png', await renderArt(browser, page(logoHtml()), { scale: 4 }));
    write('og-default.jpg', await renderArt(browser, page(ogHtml()), { type: 'jpeg', quality: 90 }));
  } finally {
    await browser.close();
  }
  console.log('\nDone. Commit the files in public/ — the site serves them as-is.');
}

main().catch((err) => {
  console.error('❌ Brand asset generation failed:', err);
  process.exit(1);
});
