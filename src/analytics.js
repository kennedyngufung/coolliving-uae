/**
 * CoolLivingUAE — Google Analytics 4
 * ---------------------------------------------------------------------------
 * Loads GA4 lazily and only ever measures with consent.
 *
 * WHY THIS IS A MODULE RATHER THAN A SCRIPT TAG IN index.html
 *
 *   1. GA4 sends one page_view when it loads and nothing thereafter. This is a
 *      single-page app, so every in-app navigation would be invisible — the
 *      homepage would appear to be the only page anyone ever visits. Route
 *      changes are reported explicitly via trackPageView().
 *   2. The measurement ID comes from an environment variable, so the site
 *      runs unmeasured until one is configured rather than shipping a broken
 *      placeholder.
 *   3. Consent has to be wired to the cookie banner, which lives in React.
 *
 * CONSENT MODEL (Google Consent Mode v2)
 *   Storage is denied by default and stays denied until the visitor accepts
 *   the cookie banner. Until then GA receives no identifiers and sets no
 *   cookies. Declining is honoured for the session and remembered. Accepting
 *   grants analytics storage only; advertising storage is never granted,
 *   because the site runs no ads.
 * ---------------------------------------------------------------------------
 */

const GA_ID = import.meta.env.VITE_GA4_ID || '';

/** GA4 measurement IDs look like G-XXXXXXXXXX. */
const VALID_ID = /^G-[A-Z0-9]{6,}$/i;

let initialised = false;

function pushToDataLayer() {
  // GA's own snippet relies on the `arguments` object rather than an array,
  // so this must stay a normal function — rest parameters would push an array
  // and gtag would not recognise the call.
  window.dataLayer.push(arguments);
}

/** True when a usable measurement ID is configured. */
export function isAnalyticsConfigured() {
  return VALID_ID.test(GA_ID);
}

/**
 * Loads GA4 and applies the stored consent choice.
 *
 * Safe to call more than once. Does nothing at all when no measurement ID is
 * set, so no network request is made and no cookie is written.
 *
 * @param {'accepted'|'declined'|null} storedConsent Previously saved choice.
 */
export function initAnalytics(storedConsent) {
  if (initialised || typeof window === 'undefined') return;

  if (!isAnalyticsConfigured()) {
    if (import.meta.env.DEV) {
      console.warn(
        '[analytics] No VITE_GA4_ID configured — analytics disabled. ' +
        'Set it in .env to start measuring. See .env.example.'
      );
    }
    return;
  }

  initialised = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = pushToDataLayer;

  // Consent defaults MUST be set before the config call, otherwise GA may
  // write a cookie in the gap before the visitor has chosen.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500,
  });

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    // Page views are sent manually so SPA navigations are captured.
    send_page_view: false,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  if (storedConsent === 'accepted') setAnalyticsConsent(true);
}

/**
 * Applies the visitor's cookie choice.
 *
 * Only analytics storage follows the banner. The advertising signals keep the
 * 'denied' default set in initAnalytics(): the site runs no ads, and the
 * banner asks for analytics only, so granting ad storage on "Accept" would go
 * beyond what the visitor agreed to.
 *
 * @param {boolean} granted
 */
export function setAnalyticsConsent(granted) {
  if (!initialised || typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

/**
 * Records a page view. Call on every route change.
 *
 * @param {string} path  Path including any parameters, e.g. "/product/ac-1".
 * @param {string} title Document title at the time of viewing.
 */
export function trackPageView(path, title) {
  if (!initialised || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title || document.title,
  });
}

/**
 * Records a custom event, e.g. an outbound affiliate click.
 *
 * @param {string} name   GA4 event name.
 * @param {object} params Event parameters.
 */
export function trackEvent(name, params = {}) {
  if (!initialised || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
