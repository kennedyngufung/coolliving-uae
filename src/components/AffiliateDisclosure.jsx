import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { hasActiveAffiliateProgramme } from '../affiliate';

/**
 * CoolLivingUAE — In-proximity affiliate disclosure
 * ---------------------------------------------------------------------------
 * The Amazon Associates Operating Agreement requires the association to be
 * disclosed "clearly and conspicuously", and the FTC's endorsement guides
 * (16 CFR Part 255) require disclosure close to the endorsement itself. A
 * standalone disclosure page does not satisfy either on its own, which is why
 * this renders directly above the commercial calls to action.
 *
 * The wording adapts to reality. Amazon's prescribed sentence — "As an Amazon
 * Associate we earn from qualifying purchases" — is only shown once a tracking
 * tag is actually configured. Displaying it before the account is approved
 * would assert a commercial relationship that does not yet exist, which is the
 * same category of misstatement the disclosure exists to prevent.
 * ---------------------------------------------------------------------------
 */
export default function AffiliateDisclosure({ className = '' }) {
  const isActive = hasActiveAffiliateProgramme();

  return (
    <div
      className={`flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 ${className}`}
    >
      <LinkIcon size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
      <p className="text-[11px] leading-relaxed text-slate-500">
        {isActive ? (
          <>
            <strong className="text-slate-600">Disclosure:</strong> As an Amazon
            Associate we earn from qualifying purchases. Links to Amazon.ae and
            Noon.ae on this page may earn CoolLivingUAE a commission at no extra
            cost to you. This never influences our rankings or verdicts.
          </>
        ) : (
          <>
            <strong className="text-slate-600">Disclosure:</strong> Links on this
            page take you to Amazon.ae and Noon.ae. CoolLivingUAE intends to join
            their affiliate programmes and may earn a commission on qualifying
            purchases in future, at no extra cost to you. Our rankings and
            verdicts are independent of any commercial arrangement.
          </>
        )}
      </p>
    </div>
  );
}
