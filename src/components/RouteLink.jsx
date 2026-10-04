import React from 'react';
import { routeToPath } from '../routes';

/**
 * CoolLivingUAE — Internal link
 * ---------------------------------------------------------------------------
 * A real <a href> for navigation inside the site. Header, footer, breadcrumb
 * and card links were previously <span onClick> elements. Search engines do
 * not follow those, so Google could reach pages only through the sitemap, and
 * visitors could not open a page in a new tab or reach the links by keyboard.
 *
 * A plain left click still navigates client-side through navigate(), so the
 * single-page behaviour is unchanged. Modified clicks (Ctrl/Cmd/Shift/Alt, or
 * the middle button) are left to the browser, which opens the real URL.
 * ---------------------------------------------------------------------------
 */
export default function RouteLink({ to, params = {}, navigate, onClick, children, ...rest }) {
  const handleClick = (event) => {
    if (typeof onClick === 'function') onClick(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to, params);
  };

  return (
    <a href={routeToPath(to, params)} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
