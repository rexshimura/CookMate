// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBradkEr4X14nCns2vP3lVgZ7l0q0ijzNg",
  authDomain: "cookmate-cc941.firebaseapp.com",
  projectId: "cookmate-cc941",
  storageBucket: "cookmate-cc941.firebasestorage.app",
  messagingSenderId: "436913801412",
  appId: "1:436913801412:web:4160b5acb5a7cc36c6a191"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

