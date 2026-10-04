/**
 * CoolLivingUAE — Catalogue overrides: Firestore access
 * ---------------------------------------------------------------------------
 * Reads and writes catalogue/overrides, the one document holding every
 * product change made in the admin dashboard. The rules for what goes in it
 * live in src/catalogueMerge.js; this module only moves data.
 *
 * One read per page load keeps the site inside Firestore's free quota (50,000
 * reads a day). Writes run in a transaction — read, change one entry, write —
 * so two open dashboard tabs cannot overwrite each other's saves, and an edit
 * whose product was saved elsewhere after its form opened is refused.
 * firestore.rules lets anyone read the document and only an allowlisted
 * admin write it.
 * ---------------------------------------------------------------------------
 */

import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { products as builtIns } from './data/products';
import {
  applyAdd, applyEdit, applyHide, applyRemoveAdded, applyRestore, describeSaveError,
} from './catalogueMerge';

const overridesRef = doc(db, 'catalogue', 'overrides');
const builtInsById = new Map(builtIns.map((p) => [p.id, p]));

function productsOf(snapshot) {
  const products = snapshot.exists() ? snapshot.data().products : null;
  return products !== null && typeof products === 'object' && !Array.isArray(products) ? products : {};
}

/**
 * The stored overrides: id → entry, or {} when nothing has been saved yet.
 * Rejects with the Firestore error when the read fails; callers fall back to
 * the built-in catalogue.
 */
export async function fetchCatalogueOverrides() {
  return productsOf(await getDoc(overridesRef));
}

/**
 * Applies one change in a transaction. `change` must be pure: Firestore may
 * run it more than once if the document changes underneath it.
 */
async function commit(change) {
  try {
    return await runTransaction(db, async (transaction) => {
      const result = change(productsOf(await transaction.get(overridesRef)));
      transaction.set(overridesRef, { products: result.products, updatedAt: serverTimestamp() });
      return result;
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('[catalogue] save failed:', error);
    throw new Error(describeSaveError(error));
  }
}

/**
 * `openedEntry` is the entry catalogue/overrides held for this product when
 * the edit form opened; the save is refused if it has changed since.
 */
export const saveEdit = (id, record, openedEntry) =>
  commit((current) => ({ products: applyEdit(current, builtInsById, id, record, openedEntry) }));

export const addProduct = (record) =>
  commit((current) => applyAdd(current, builtInsById, record));

export const hideProduct = (id) =>
  commit((current) => ({ products: applyHide(current, builtInsById, id) }));

export const restoreOriginal = (id) =>
  commit((current) => ({ products: applyRestore(current, builtInsById, id) }));

export const removeAddedProduct = (id) =>
  commit((current) => ({ products: applyRemoveAdded(current, builtInsById, id) }));
