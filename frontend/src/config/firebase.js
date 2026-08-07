import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const getEnvVar = (viteKey, reactKey, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    if (import.meta.env[reactKey]) return import.meta.env[reactKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[viteKey]) return process.env[viteKey];
    if (process.env[reactKey]) return process.env[reactKey];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY', 'AIzaSyCjlg9OrfgxH-8IYqEFaoPSfSxzxBk72Wo'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'fairlens-36622.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID', 'fairlens-36622'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET', 'fairlens-36622.firebasestorage.app'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', '110531577383'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID', '1:110531577383:web:2bfaf403568ef7e1f17002'),
};

// Singleton Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
