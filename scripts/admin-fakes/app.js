/**
 * Stand-in for firebase/app, used only by scripts/check-admin.mjs.
 * src/firebase.js needs nothing from the app object but its existence.
 */
export const initializeApp = (options) => ({ options });
