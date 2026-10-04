/**
 * Stand-in for firebase/auth, used only by scripts/check-admin.mjs.
 * Always signed in, so the check lands straight on the admin dashboard.
 * Real access control lives in firestore.rules and is checked against the
 * live project by scripts/check-rules.mjs, not here.
 */
const user = { uid: 'check-admin', email: 'check-admin@example.invalid' };

export const getAuth = () => ({ currentUser: user });

// Like the real listener, reports the state asynchronously.
export function onAuthStateChanged(auth, callback) {
  const timer = setTimeout(() => callback(user), 0);
  return () => clearTimeout(timer);
}

export async function signInWithEmailAndPassword() {
  return { user };
}

export async function signOut() {}

export async function sendPasswordResetEmail() {}
