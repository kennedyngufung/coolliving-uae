/**
 * CoolLivingUAE — Affiliate link construction
 * ---------------------------------------------------------------------------
 * Single source of truth for every outbound commercial link on the site.
 *
 * Why this module exists: product data stores SEARCH TERMS, never finished
 * URLs. Every URL is built here, at render time, with the tracking tag applied
 * by construction. That makes an untagged affiliate link structurally
 * impossible rather than merely discouraged.
 *
 * Tags are read from environment variables. When Amazon approves the
 * Associates account, wiring the real tracking ID is a one-line .env change,
 * not an edit across sixty product records.
 * ---------------------------------------------------------------------------
 */

const AMAZON_AE_TAG = import.meta.env.VITE_AMAZON_AE_TAG || '';
const NOON_TAG      = import.meta.env.VITE_NOON_TAG || '';

const AMAZON_AE_ORIGIN = 'https://www.amazon.ae';
// Full search path, not an origin. A leading-slash path passed to new URL()
// resolves from the origin and would silently drop the /uae-en locale segment,
// sending shoppers to the wrong Noon storefront.
const NOON_AE_SEARCH   = 'https://www.noon.com/uae-en/search/';

/**
 * Development-only notice, emitted at most once per tag, so a missing
 * tracking ID is visible while building without writing anything to a
 * production console.
 */
const warnedFor = new Set();
function warnMissingTag(programme) {
  if (!import.meta.env.DEV || warnedFor.has(programme)) return;
  warnedFor.add(programme);
  console.warn(
    `[affiliate] No ${programme} tracking tag configured. Links will be built ` +
    `without attribution and will earn no commission. Set the relevant ` +
    `variable in .env — see .env.example.`
  );
}

/**
 * Search terms must be a non-empty string. Anything else yields null so the
 * caller can render a disabled state instead of a broken link.
 */
function normaliseQuery(query) {
  if (typeof query !== 'string') return null;
  const trimmed = query.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Amazon ASINs are exactly 10 alphanumeric characters. Anything else is
 * rejected rather than silently producing a 404 product URL.
 */
function normaliseAsin(asin) {
  if (typeof asin !== 'string') return null;
  const trimmed = asin.trim().toUpperCase();
  return /^[A-Z0-9]{10}$/.test(trimmed) ? trimmed : null;
}

/**
 * Build an Amazon.ae URL with the Associates tag applied.
 *
 * Prefers a direct product link when a valid ASIN is supplied, falling back to
 * a search URL. Direct product links convert considerably better and are the
 * intended upgrade path once listings are verified post-approval.
 *
 * @param   {{ query?: string, asin?: string }} options
 * @returns {string|null} Tagged URL, or null when there is nothing valid to link to.
 */
export function buildAmazonUrl({ query, asin } = {}) {
  if (!AMAZON_AE_TAG) warnMissingTag('Amazon.ae Associates');

  const validAsin = normaliseAsin(asin);
  const url = validAsin
    ? new URL(`/dp/${validAsin}`, AMAZON_AE_ORIGIN)
    : (() => {
        const terms = normaliseQuery(query);
        if (!terms) return null;
        const searchUrl = new URL('/s', AMAZON_AE_ORIGIN);
        searchUrl.searchParams.set('k', terms);
        return searchUrl;
      })();

  if (!url) return null;
  if (AMAZON_AE_TAG) url.searchParams.set('tag', AMAZON_AE_TAG);
  return url.toString();
}

/**
 * Build a Noon.ae search URL with the affiliate tag applied.
 *
 * @param   {{ query?: string }} options
 * @returns {string|null} Tagged URL, or null when the search terms are unusable.
 */
export function buildNoonUrl({ query } = {}) {
  if (!NOON_TAG) warnMissingTag('Noon affiliate');

  const terms = normaliseQuery(query);
  if (!terms) return null;

  const url = new URL(NOON_AE_SEARCH);
  url.searchParams.set('q', terms);
  if (NOON_TAG) url.searchParams.set('utm_source', NOON_TAG);
  return url.toString();
}

/**
 * Whether any affiliate programme is currently configured. Used to decide
 * whether commission disclosures need to be shown: claiming to earn a
 * commission while unaffiliated would itself be a misleading statement.
 */
export function hasActiveAffiliateProgramme() {
  return Boolean(AMAZON_AE_TAG || NOON_TAG);
}

/** Relationship attributes required on every outbound commercial link. */
export const AFFILIATE_REL = 'sponsored nofollow noopener noreferrer';
