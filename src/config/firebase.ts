      import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase project configuration.
 * Replace these placeholder values with your actual Firebase project credentials.
 * You can find these in Firebase Console > Project Settings > General > Your apps.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Initialize Firebase — avoid reinitializing if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth instance configured for email + Google sign-in
const auth = getAuth(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const emailProvider = new EmailAuthProvider();

// Firestore instance
const db = getFirestore(app);

export { app, auth, db, googleProvider, emailProvider, firebaseConfig };
