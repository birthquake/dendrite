import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6xREwV56xcP5LNWPNgxB0Bi2FSb9SWyk",
  authDomain: "dendrite-b860e.firebaseapp.com",
  projectId: "dendrite-b860e",
  storageBucket: "dendrite-b860e.firebasestorage.app",
  messagingSenderId: "1075197492679",
  appId: "1:1075197492679:web:22caca376a834592192de2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
