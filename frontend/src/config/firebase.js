import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCjlg9OrfgxH-8IYqEFaoPSfSxzxBk72Wo',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'fairlens-36622.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'fairlens-36622',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'fairlens-36622.firebasestorage.app',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '110531577383',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:110531577383:web:2bfaf403568ef7e1f17002',
};

// Singleton Firebase initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
