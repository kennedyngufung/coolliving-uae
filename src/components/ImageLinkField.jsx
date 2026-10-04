import React, { useState } from 'react';

/**
 * CoolLivingUAE — Photo link input for the admin product forms
 * ---------------------------------------------------------------------------
 * Photos are added as links because uploads would need Firebase Storage,
 * which is only offered on the pay-as-you-go Blaze plan. The field previews
 * the link so a mistake shows before saving, and says when a link does not
 * load an image. If a saved link breaks later, the site shows a neutral tile
 * instead (src/components/ProductImage.jsx).
 * ---------------------------------------------------------------------------
 */
export default function ImageLinkField({ id, value, onChange, inputClassName, labelClassName }) {
  // Remember which link failed, so correcting it clears the warning.
  const [failedLink, setFailedLink] = useState('');
  const link = value.trim();
  const previewable = /^https:\/\//i.test(link) || link.startsWith('/images/');

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>Photo Link</label>
      <input id={id} type="url" inputMode="url" className={inputClassName}
        placeholder="https://… from the manufacturer's website"
        value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-[10px] text-slate-400 mt-1">
        On the manufacturer's website, right-click the product photo and choose “Copy image address”.
        Use the manufacturer's photo, not one copied from Amazon. Leave empty to show a neutral tile.
      </p>
      {link && !previewable && (
        <p className="text-[11px] font-bold text-red-600 mt-1" role="alert">The link must start with https://</p>
      )}
      {previewable && failedLink !== link && (
        <img src={link} alt="Photo preview" onError={() => setFailedLink(link)}
          className="mt-2 h-24 w-auto max-w-full rounded-xl border border-slate-100 object-contain bg-white" />
      )}
      {previewable && failedLink === link && (
        <p className="text-[11px] font-bold text-red-600 mt-1" role="alert">
          This link doesn't load an image. Check you copied the image address, not the page address.
        </p>
      )}
    </div>
  );
}
