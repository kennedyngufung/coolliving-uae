/**
 * CoolLivingUAE — URL ↔ route mapping
 * ---------------------------------------------------------------------------
 * The app keeps its own { path, params } route object rather than using a
 * router library. This module is the single place that translates between that
 * object and a real browser URL, in both directions.
 *
 * Why it exists: the site previously had no URL handling at all. Every page
 * lived at "/", which meant deep links did not work, the browser back button
 * did nothing, and the 73 URLs advertised in the sitemap could not be served —
 * Googlebot would have found 60 product URLs all rendering the homepage.
 *
 * Keeping the { path, params } shape means every existing navigate() call site
 * continues to work unchanged; only the plumbing around them is new.
 *
 * IMPORTANT: any host serving this app must rewrite unknown paths to
 * /index.html, or a visitor loading /product/ac-1 directly gets a 404 from the
 * server before React ever runs. See the hosting rewrite in firebase.json.
 * ---------------------------------------------------------------------------
 */

/** Routes with no parameters: internal path name ↔ URL segment. */
const STATIC_ROUTES = {
  '/': '/',
  guides: '/guides',
  reviews: '/reviews',
  contact: '/contact',
  privacy: '/privacy',
  cookies: '/cookies',
  affiliate: '/affiliate',
  security: '/security',
  terms: '/terms',
  calculator: '/calculator',
  admin: '/admin',
};

/**
 * Routes carrying a single :id segment.
 * `optionalId` marks routes reachable with or without the parameter.
 */
const ID_ROUTES = {
  category: { segment: 'category', optionalId: false },
  product: { segment: 'product', optionalId: false },
  installation: { segment: 'installation', optionalId: true },
};

/** Route rendered when a URL matches nothing. The App switch falls through to 404. */
export const NOT_FOUND = { path: 'not-found', params: {} };

/**
 * Builds a URL from an internal route.
 *
 * @param   {string} path   Internal route name, e.g. 'product'.
 * @param   {object} params Route parameters, e.g. { id: 'ac-1' }.
 * @returns {string} Absolute path beginning with "/".
 */
export function routeToPath(path, params = {}) {
  if (Object.prototype.hasOwnProperty.call(STATIC_ROUTES, path)) {
    return STATIC_ROUTES[path];
  }

  const idRoute = ID_ROUTES[path];
  if (idRoute) {
    const id = params?.id;
    if (id === undefined || id === null || id === '') {
      // Only legitimate for routes that work without an id, such as a general
      // installation enquiry not tied to a specific product.
      return idRoute.optionalId ? `/${idRoute.segment}` : '/';
    }
    return `/${idRoute.segment}/${encodeURIComponent(id)}`;
  }

  // Unknown internal route — send the browser somewhere real rather than
  // writing a bogus URL into the history stack.
  return '/';
}

/**
 * Parses a browser pathname into an internal route.
 *
 * @param   {string} pathname e.g. "/product/ac-1"
 * @returns {{ path: string, params: object }}
 */
export function pathToRoute(pathname) {
  if (typeof pathname !== 'string' || pathname === '') return { path: '/', params: {} };

  // Split on "/" and drop empties, which also normalises trailing slashes
  // and repeated separators.
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return { path: '/', params: {} };

  const [first, second, ...rest] = segments;

  // No route uses more than two segments; anything deeper is not ours.
  if (rest.length > 0) return { ...NOT_FOUND };

  if (segments.length === 1) {
    const match = Object.keys(STATIC_ROUTES).find(
      (name) => STATIC_ROUTES[name] === `/${first}`
    );
    if (match) return { path: match, params: {} };

    // A parameterised route reached without its parameter.
    const idRouteName = Object.keys(ID_ROUTES).find(
      (name) => ID_ROUTES[name].segment === first
    );
    if (idRouteName && ID_ROUTES[idRouteName].optionalId) {
      return { path: idRouteName, params: {} };
    }

    return { ...NOT_FOUND };
  }

  // Two segments: /<segment>/<id>
  const idRouteName = Object.keys(ID_ROUTES).find(
    (name) => ID_ROUTES[name].segment === first
  );
  if (!idRouteName) return { ...NOT_FOUND };

  let id;
  try {
    id = decodeURIComponent(second);
  } catch {
    // Malformed percent-encoding, e.g. /product/%E0%A4%A
    return { ...NOT_FOUND };
  }

  return { path: idRouteName, params: { id } };
}

/**
 * Every crawlable URL on the site, for the sitemap and prerender scripts.
 * The admin route is deliberately excluded — it is disallowed in robots.txt
 * and must never be advertised.
 *
 * @param   {Array} products Catalogue from src/data/products.js.
 * @returns {string[]} Absolute paths.
 */
export function crawlablePaths(products = []) {
  const staticPaths = Object.entries(STATIC_ROUTES)
    .filter(([name]) => name !== 'admin')
    .map(([, url]) => url);

  const categoryPaths = ['smart-acs', 'air-purifiers', 'smart-thermostats'].map(
    (id) => `/category/${id}`
  );

  const productPaths = products.map((product) => `/product/${product.id}`);

  return [...staticPaths, ...categoryPaths, ...productPaths];
}
