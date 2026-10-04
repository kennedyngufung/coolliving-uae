/**
 * CoolLivingUAE — Live Firestore rules check
 * ---------------------------------------------------------------------------
 * Run: npm run check-rules
 *
 * Sends unauthenticated requests to the live database, exactly as any visitor
 * could, and checks each answer matches firestore.rules. Writes carry a
 * precondition that can never hold (an updateTime in the year 2000), so even
 * a write the rules wrongly allowed could not change anything.
 *
 * The project id and web API key are read from src/firebase.js; the key is a
 * public identifier, not a secret.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';

const config = fs.readFileSync(new URL('../src/firebase.js', import.meta.url), 'utf8');
const API_KEY = config.match(/apiKey:\s*"([^"]+)"/)[1];
const PROJECT = config.match(/projectId:\s*"([^"]+)"/)[1];
const DATABASE = `projects/${PROJECT}/databases/(default)`;
const API = `https://firestore.googleapis.com/v1/${DATABASE}/documents`;
const NEVER = '2000-01-01T00:00:00Z';

async function request(url, body) {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}key=${API_KEY}`, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  const json = await res.json().catch(() => ({}));
  const error = Array.isArray(json) ? json[0]?.error : json.error;
  return { status: res.status, code: error?.status || 'OK' };
}

const read = (path) => request(`${API}/${path}`);
const list = (collection) => request(`${API}/${collection}?pageSize=1&mask.fieldPaths=zzNoSuchField`);
const write = (path, fields) => request(`${API}:commit`, {
  writes: [{
    update: { name: `${DATABASE}/documents/${path}`, fields },
    updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
    currentDocument: { updateTime: NEVER },
  }],
});
const approvedReviews = () => request(`${API}:runQuery`, {
  structuredQuery: {
    from: [{ collectionId: 'residentReviews' }],
    where: { fieldFilter: { field: { fieldPath: 'approved' }, op: 'EQUAL', value: { booleanValue: true } } },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
    limit: 1,
  },
});

const CHECKS = [
  ['anyone can read catalogue/overrides', () => read('catalogue/overrides'), (r) => r.status === 200 || r.status === 404],
  ['a signed-out visitor cannot write catalogue/overrides', () => write('catalogue/overrides', { products: { mapValue: { fields: {} } } }), (r) => r.code === 'PERMISSION_DENIED'],
  ['other catalogue documents stay private', () => read('catalogue/not-overrides'), (r) => r.code === 'PERMISSION_DENIED'],
  ['installation leads cannot be listed', () => list('installationRequests'), (r) => r.code === 'PERMISSION_DENIED'],
  ['unfiltered review lists are refused', () => list('residentReviews'), (r) => r.code === 'PERMISSION_DENIED'],
  ['approved reviews can be queried (rules + index)', approvedReviews, (r) => r.status === 200],
];

let failed = 0;
for (const [label, run, expect] of CHECKS) {
  const result = await run();
  const ok = expect(result);
  if (!ok) failed += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(52)} ${result.status} ${result.code}`);
}
console.log(failed ? `\n❌ ${failed} rule check(s) failed.` : '\n✅ Live rules behave as firestore.rules says.');
process.exit(failed ? 1 : 0);
