import React from 'react';
import { buildAmazonUrl, buildNoonUrl, AFFILIATE_REL } from '../affiliate';

/**
 * CoolLivingUAE — Outbound commercial link
 * ---------------------------------------------------------------------------
 * Every link that can earn a commission renders through this component.
 *
 * It is a real anchor, not a button calling window.open(). That matters for
 * three reasons: popup blockers silently discard window.open() calls made
 * outside a trusted gesture chain; middle-click, cmd-click and "open in new
 * tab" do not work on a button; and Amazon's Operating Agreement requires
 * that affiliate links not be obscured from users or crawlers.
 *
 * rel="sponsored nofollow noopener noreferrer":
 *   sponsored  — Google's required marker for paid/affiliate links
 *   nofollow   — long-standing fallback for crawlers predating `sponsored`
 *   noopener   — closes the reverse-tabnabbing hole opened by target="_blank"
 *   noreferrer — withholds the referrer header
 * ---------------------------------------------------------------------------
 */

const MERCHANT_BUILDERS = {
  amazon: buildAmazonUrl,
  noon: buildNoonUrl,
};

export default function AffiliateLink({
  merchant = 'amazon',
  query,
  asin,
  className = '',
  children,
  onNavigate,
  trackingLabel,
  ...rest
}) {
  const build = MERCHANT_BUILDERS[merchant];

  if (!build) {
    // An unknown merchant is a programming error, not a runtime condition.
    // Fail visibly in development, degrade quietly in production.
    if (import.meta.env.DEV) {
      throw new Error(`AffiliateLink: unknown merchant "${merchant}".`);
    }
    return null;
  }

  const href = build({ query, asin });

  // No usable URL — render a disabled control rather than a dead link that
  // navigates nowhere. This is what a product missing its search terms gets.
  if (!href) {
    return (
      <span
        className={`${className} opacity-50 cursor-not-allowed`}
        aria-disabled="true"
        title="Link unavailable"
      >
        {children}
      </span>
    );
  }

  const handleClick = (event) => {
    // Allow the parent to stop a card-level navigation handler from firing.
    if (typeof onNavigate === 'function') onNavigate(event);

    // Analytics only ever fire through gtag, which the app configures with
    // Consent Mode v2 denied by default. If the visitor has not accepted
    // cookies, gtag is either absent or holding consent denied, so no
    // identifier is transmitted. We do not track independently of consent.
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'affiliate_click', {
        merchant,
        item_name: trackingLabel || query || asin || 'unknown',
      });
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel={AFFILIATE_REL}
      className={className}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
