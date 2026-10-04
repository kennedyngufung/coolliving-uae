/**
 * Stand-in for firebase/firestore, used only by scripts/check-admin.mjs.
 *
 * Keeps documents in memory, keyed by path ("catalogue/overrides"). The check
 * seeds them through window.__seedDocuments before the page loads, and reads
 * or changes them through window.__firestore — changing a document between
 * two steps is how it plays "another device saved this". Implements only the
 * functions src/ imports; queries ignore their constraints.
 */
const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

const documents = new Map(Object.entries(window.__seedDocuments || {}).map(([path, data]) => [path, clone(data)]));

window.__firestore = {
  get: (path) => clone(documents.get(path)),
  set: (path, data) => { documents.set(path, clone(data)); },
};

export const getFirestore = () => ({});
export const doc = (db, ...segments) => ({ path: segments.join('/') });
export const collection = (db, name) => ({ collection: name });
export const query = (ref) => ref;
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const serverTimestamp = () => ({ serverTimestamp: true });

const snapshotOf = (ref) => {
  const data = documents.get(ref.path);
  return { exists: () => data !== undefined, data: () => clone(data) };
};

export async function getDoc(ref) {
  return snapshotOf(ref);
}

export async function getDocs(ref) {
  const prefix = `${ref.collection}/`;
  const docs = [...documents.entries()]
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, data]) => ({ id: path.slice(prefix.length), data: () => clone(data) }));
  return { docs };
}

export async function addDoc(ref, data) {
  const id = `fake-${documents.size + 1}`;
  documents.set(`${ref.collection}/${id}`, clone(data));
  return { id };
}

export async function updateDoc(ref, data) {
  documents.set(ref.path, { ...documents.get(ref.path), ...clone(data) });
}

export async function deleteDoc(ref) {
  documents.delete(ref.path);
}

// Writes land only if the update function finishes; a throw leaves every
// document untouched, as in Firestore.
export async function runTransaction(db, update) {
  const writes = [];
  const result = await update({
    get: async (ref) => snapshotOf(ref),
    set: (ref, data) => { writes.push([ref.path, clone(data)]); },
  });
  for (const [path, data] of writes) documents.set(path, data);
  return result;
}
