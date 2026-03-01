import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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