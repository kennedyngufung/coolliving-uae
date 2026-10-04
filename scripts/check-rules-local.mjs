/**
 * CoolLivingUAE — Firestore rules, tested in the emulator
 * ---------------------------------------------------------------------------
 * Run: npm run check-rules-local      (needs Java 11+ on PATH)
 *
 * Runs firestore.rules in the Firestore emulator under the project id
 * demo-coolliving, which Firebase never connects to a real project, and
 * checks writes that scripts/check-rules.mjs cannot probe on the live
 * database: proving a public create is ALLOWED means actually creating
 * something, and that only belongs in the emulator. Run this before every
 * rules deploy; run check-rules after it.
 * ---------------------------------------------------------------------------
 */

import fs from 'fs';

const HOST = process.env.FIRESTORE_EMULATOR_HOST;
if (!HOST) {
  console.error('Start this through `npm run check-rules-local`, which runs it inside the Firestore emulator.');
  process.exit(1);
}

const PROJECT = 'demo-coolliving';
const DATABASE = `projects/${PROJECT}/databases/(default)`;
const API = `http://${HOST}/v1/${DATABASE}/documents`;
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const ADMIN_UID = rules.match(/function adminUids\(\)\s*\{\s*return\s*\[\s*'([^']+)'/)[1];

// The emulator accepts unsigned ID tokens, so a test can sign in as anyone.
function idToken(uid) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: uid, user_id: uid, aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
    iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'password', identities: {} },
  })}.`;
}

async function send(url, { body, uid } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(uid ? { Authorization: `Bearer ${idToken(uid)}` } : {}) };
  const res = await fetch(url, body ? { method: 'POST', headers, body: JSON.stringify(body) } : { headers });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, code: json.error?.status || 'OK' };
}

/** Creates or overwrites one document, stamping `timestampField` with the request time. */
const write = (path, fields, { timestampField, uid } = {}) => send(`${API}:commit`, {
  uid,
  body: {
    writes: [{
      update: { name: `${DATABASE}/documents/${path}`, fields },
      ...(timestampField ? { updateTransforms: [{ fieldPath: timestampField, setToServerValue: 'REQUEST_TIME' }] } : {}),
    }],
  },
});

const text = (value) => ({ stringValue: value });

// Exactly what the installation form sends: every field, empty when unused.
const LEAD = {
  name: text('Rules Check'), phone: text('0500000000'), location: text('Dubai - Other'),
  propertyType: text(''), acType: text(''), acCapacity: text(''), message: text(''),
};
const lead = (id, extra = {}) => write(`installationRequests/${id}`, { ...LEAD, ...extra }, { timestampField: 'createdAt' });
const overrides = (uid) => write('catalogue/overrides', { products: { mapValue: { fields: {} } } }, { timestampField: 'updatedAt', uid });

const allowed = (r) => r.status === 200;
const denied = (r) => r.code === 'PERMISSION_DENIED';

const CHECKS = [
  ['a lead without a product is accepted', () => lead('plain'), allowed],
  ['a lead naming a built-in product is accepted', () => lead('built-in', { productId: text('ac-1'), productTitle: text('LG DualCool 1.5 Ton Inverter Split AC') }), allowed],
  ['a lead naming an admin-added product is accepted', () => lead('added', { productId: text('lg-artcool-1-5-ton-ab12'), productTitle: text('LG ArtCool 1.5 Ton') }), allowed],
  ['a lead with a malformed product id is refused', () => lead('bad-id', { productId: text('AC 1/../x'), productTitle: text('LG') }), denied],
  ['a lead with a product title over 140 characters is refused', () => lead('long-title', { productId: text('ac-1'), productTitle: text('x'.repeat(141)) }), denied],
  ['a lead with an unexpected field is refused', () => lead('extra', { email: text('someone@example.com') }), denied],
  ['a signed-out visitor cannot read a lead', () => send(`${API}/installationRequests/plain`), denied],
  ['a signed-out visitor cannot save the catalogue', () => overrides(), denied],
  ['a signed-in stranger cannot save the catalogue', () => overrides('someone-else'), denied],
  ['the admin can save the catalogue', () => overrides(ADMIN_UID), allowed],
];

let failed = 0;
for (const [label, run, expect] of CHECKS) {
  const result = await run();
  const ok = expect(result);
  if (!ok) failed += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(58)} ${result.status} ${result.code}`);
}
console.log(failed ? `\n❌ ${failed} rule check(s) failed.` : '\n✅ firestore.rules behaves as intended in the emulator.');
// exitCode, not process.exit(): on Windows, exiting while fetch still holds
// connections to the emulator crashes Node (exit code 3221226505).
process.exitCode = failed ? 1 : 0;
