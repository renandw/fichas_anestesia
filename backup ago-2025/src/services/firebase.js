import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyB7rke2IJp4o7XrPhD--tq8LeQilsArRuY",
  authDomain: "anestesia-app-804e0.firebaseapp.com",
  projectId: "anestesia-app-804e0",
  storageBucket: "anestesia-app-804e0.firebasestorage.app",
  messagingSenderId: "181211466966",
  appId: "1:181211466966:web:dcbf0106f780a493a2cd77",
  measurementId: "G-XXLBLQ9P6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;