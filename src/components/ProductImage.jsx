import React, { useState } from 'react';
import { AirVent, Wind, Thermometer } from 'lucide-react';

/**
 * CoolLivingUAE — Product photo with an honest fallback
 * ---------------------------------------------------------------------------
 * Shows the product's own photo when it has one and it loads. Otherwise shows
 * a neutral tile with the category icon and the brand name.
 *
 * This replaces a fallback that swapped every missing or broken image for one
 * hardcoded photo of a Samsung split AC, so air purifier and thermostat pages
 * displayed an air conditioner and most AC pages displayed the wrong brand.
 * A visitor can tell a "no photo" tile from a product photo; they cannot tell
 * a borrowed photo from a real one.
 * ---------------------------------------------------------------------------
 */

const CATEGORY_ICONS = {
  'smart-acs': AirVent,
  'air-purifiers': Wind,
  'smart-thermostats': Thermometer,
};

/**
 * @param {object}  props
 * @param {string}  props.src       Photo URL or site path; '' when none is verified.
 * @param {string}  props.alt       Alt text for the photo.
 * @param {string}  props.brand     Shown on the fallback tile.
 * @param {string}  props.category  Catalogue category id; picks the tile icon.
 * @param {string}  props.className Sizing and framing, applied to photo or tile alike.
 * @param {boolean} props.compact   Icon-only tile, for small thumbnails.
 * @param {boolean} props.priority  Load immediately — for the main image above the fold.
 * @param {string}  props.caption   Shown under a photo only, never under a tile.
 */
export default function ProductImage({
  src,
  alt,
  brand = '',
  category,
  className = '',
  compact = false,
  priority = false,
  caption = '',
}) {
  // Remember WHICH source failed rather than a plain flag. The same component
  // instance is reused when navigating from one review page to the next, and a
  // flag would carry the previous product's failure over to the new one.
  const [failedSrc, setFailedSrc] = useState(null);
  const hasPhoto = typeof src === 'string' && src !== '' && failedSrc !== src;

  if (hasPhoto) {
    const photo = (
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={`object-contain bg-white ${className}`}
      />
    );
    if (!caption) return photo;
    return (
      <figure>
        {photo}
        <figcaption className="mt-2 text-[10px] leading-snug text-slate-400">{caption}</figcaption>
      </figure>
    );
  }

  const Icon = CATEGORY_ICONS[category] || AirVent;
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-blue-50 text-blue-600 ${className}`}
    >
      {compact ? (
        <Icon size={20} strokeWidth={1.75} />
      ) : (
        <>
          <span className="rounded-full bg-white p-4 shadow-sm">
            <Icon size={36} strokeWidth={1.5} />
          </span>
          {brand && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{brand}</span>
          )}
        </>
      )}
    </div>
  );
}
