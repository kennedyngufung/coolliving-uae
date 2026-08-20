/**
 * CoolLivingUAE — Resident reviews
 * ---------------------------------------------------------------------------
 * Replaces the fabricated testimonials that previously shipped as static data.
 * Publishing invented consumer reviews is prohibited by the FTC's rule on
 * fake reviews (16 CFR Part 465) and by Amazon's Operating Agreement, so the
 * only reviews this site displays are ones real visitors submitted.
 *
 * MODERATION MODEL
 *   - Submissions are written with approved: false and are not publicly
 *     readable in that state.
 *   - An administrator approves them before they appear anywhere on the site.
 *   - Enforcement lives in firestore.rules, NOT here. The validation in this
 *     file exists to give submitters useful errors; it is not a security
 *     control, because anything running in the browser can be bypassed.
 *
 * PRIVACY
 *   Only a display name and emirate are ever stored. No email address, no
 *   phone number — a public reviews list is the wrong place for contact data.
 * ---------------------------------------------------------------------------
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export const REVIEWS_COLLECTION = 'residentReviews';

/** Emirates offered in the submission form. */
export const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

/**
 * Field limits. Mirrored in firestore.rules — change both together, or the
 * rules will reject submissions the form considers valid.
 */
export const LIMITS = {
  name: { min: 2, max: 60 },
  area: { max: 60 },
  text: { min: 40, max: 1200 },
};

/**
 * Validates a submission and returns { valid, errors, cleaned }.
 * `cleaned` is the exact shape written to Firestore.
 */
export function validateReview(input) {
  const errors = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const emirate = typeof input.emirate === 'string' ? input.emirate.trim() : '';
  const area = typeof input.area === 'string' ? input.area.trim() : '';
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  const rating = Number(input.rating);

  if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
    errors.name = `Please enter a name between ${LIMITS.name.min} and ${LIMITS.name.max} characters.`;
  }
  if (!EMIRATES.includes(emirate)) {
    errors.emirate = 'Please select your emirate.';
  }
  if (area.length > LIMITS.area.max) {
    errors.area = `Area must be ${LIMITS.area.max} characters or fewer.`;
  }
  if (text.length < LIMITS.text.min || text.length > LIMITS.text.max) {
    errors.text = `Please write between ${LIMITS.text.min} and ${LIMITS.text.max} characters.`;
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    cleaned: { name, emirate, area, text, rating },
  };
}

/**
 * Writes a review for moderation.
 *
 * @throws {Error} with a message safe to display when validation or the write
 *                 fails. Callers must surface it rather than swallowing it.
 */
export async function submitReview(input) {
  const { valid, errors, cleaned } = validateReview(input);
  if (!valid) {
    const first = Object.values(errors)[0];
    throw new Error(first || 'Please check the form and try again.');
  }

  try {
    await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...cleaned,
      approved: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Firestore surfaces permission and quota problems here. Log the detail
    // for diagnosis but return a message that does not leak internals.
    if (import.meta.env.DEV) console.error('[reviews] submit failed:', error);
    throw new Error(
      'We could not save your review just now. Please try again in a moment.'
    );
  }
}

/**
 * Fetches approved reviews, newest first.
 *
 * Always bounded — an unbounded list query grows without limit as submissions
 * accumulate and would eventually dominate both read costs and page weight.
 *
 * @param   {number} count Maximum reviews to return.
 * @returns {Promise<Array>} Approved reviews, or an empty array on failure.
 */
export async function fetchApprovedReviews(count = 12) {
  const bounded = Math.min(Math.max(Number(count) || 12, 1), 50);
  try {
    const snapshot = await getDocs(
      query(
        collection(db, REVIEWS_COLLECTION),
        where('approved', '==', true),
        orderBy('createdAt', 'desc'),
        fsLimit(bounded)
      )
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // A read failure must not break the page. Callers render an empty state.
    if (import.meta.env.DEV) console.error('[reviews] fetch failed:', error);
    return [];
  }
}
