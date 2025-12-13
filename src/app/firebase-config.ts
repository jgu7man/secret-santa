import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config
// Get this from Firebase Console > Project Settings > General > Your apps
//
// SECURITY NOTE: For production apps, consider using Angular environment files
// to manage different configurations and keep sensitive data secure.
// See: https://angular.dev/tools/cli/environments
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore = getFirestore(app);
export const auth = getAuth(app);
