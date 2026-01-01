import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
// For local development, create a .env.local file with these values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuCs6Rjdo4x34WMwuV24mwextWTdUunTU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vbm-tktmngt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vbm-tktmngt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vbm-tktmngt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "231939944650",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:231939944650:web:20c4769ca1ba6b12e7c433",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-11BPTX6ZBZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
