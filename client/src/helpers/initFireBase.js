import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDEZ0A3F6Q07bulJtlmFRGXMpJ653auwZM",
    authDomain: "musicapp-ec944.firebaseapp.com",
    projectId: "musicapp-ec944",
    storageBucket: "musicapp-ec944.firebasestorage.app",
    messagingSenderId: "103191199587",
    appId: "1:103191199587:web:533cc1bd64008c1dc91d56",
    measurementId: "G-REB9JRY3MN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize messaging only if supported
let messaging = null;
try {
  // Check if messaging is supported (HTTPS or localhost, and browser support)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '[::1]';
    const isSecure = window.location.protocol === 'https:';
    
    if (isLocalhost || isSecure) {
      messaging = getMessaging(app);
      console.log('Firebase Messaging initialized');
    } else {
      console.warn('Firebase Messaging requires HTTPS or localhost');
    }
  } else {
    console.warn('Service Worker not supported in this browser');
  }
} catch (error) {
  console.warn('Firebase Messaging initialization failed:', error.message);
}

export { messaging };
