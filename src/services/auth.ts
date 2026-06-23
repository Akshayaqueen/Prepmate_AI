/**
 * PrepMate AI — Firebase Auth Service
 *
 * Provides sign-up, sign-in (email + Google), and sign-out flows.
 * On registration, creates a user document in Firestore with default values.
 *
 * Validates: Requirements 8.4
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import {
  Industry,
  ExperienceLevel,
  InterviewTimeline,
  Persona,
} from '../types';

/**
 * Creates a new user account with email/password and writes
 * a default user profile document to Firestore.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  // Set the display name on the Firebase Auth profile
  await updateProfile(userCredential.user, { displayName });

  // Create the Firestore user document with defaults
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName,
    industry: Industry.Technology,
    experienceLevel: ExperienceLevel.Student,
    interviewTimeline: InterviewTimeline.NoDeadline,
    preferredPersona: Persona.Friendly,
    notificationTime: '09:00',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Signs in an existing user with email and password.
 */
export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs in with Google using a popup flow.
 * If the user is new (first sign-in), creates a Firestore user document.
 */
export async function signInWithGoogle(): Promise<void> {
  const result = await signInWithPopup(auth, googleProvider);
  const { uid, email, displayName } = result.user;

  // Create user doc if this is a new Google sign-in
  // setDoc with merge avoids overwriting existing data on repeat sign-ins
  await setDoc(
    doc(db, 'users', uid),
    {
      email: email || '',
      displayName: displayName || '',
      industry: Industry.Technology,
      experienceLevel: ExperienceLevel.Student,
      interviewTimeline: InterviewTimeline.NoDeadline,
      preferredPersona: Persona.Friendly,
      notificationTime: '09:00',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Signs the current user out.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
