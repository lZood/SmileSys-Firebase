
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "smilesys-txm5i",
  appId: "1:12180075871:web:60da04a6b4fdaad2ccf2ea",
  storageBucket: "smilesys-txm5i.firebasestorage.app",
  apiKey: "AIzaSyD99-bnXXG6_vbXe7ynUkGRTnizcLF4l5g",
  authDomain: "smilesys-txm5i.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "12180075871"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
