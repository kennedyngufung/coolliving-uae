import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Firebase web configuration.
 *
 * These values are NOT secrets. Google documents the web API key as a public
 * project identifier — it ships inside every client bundle by design and
 * cannot be hidden from a browser. Access control comes entirely from
 * Firestore security rules (see firestore.rules at the repository root) and
 * from Firebase Authentication, never from concealing this object.
 *
 * The practical consequence: if firestore.rules is permissive, this data is
 * public regardless of anything done in application code.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCbzGbL8byuKrt4Zfg5fsFoU3uIytHjjxU",
  authDomain: "coolliving-uae.firebaseapp.com",
  projectId: "coolliving-uae",
  storageBucket: "coolliving-uae.firebasestorage.app",
  messagingSenderId: "904922083114",
  appId: "1:904922083114:web:e5016b380786be2e19b853"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
