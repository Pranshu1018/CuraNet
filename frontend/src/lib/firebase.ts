// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJ2WW7xDNdEX8EDD29_KjeDiQOEjydUmk",
  authDomain: "medisync-c2ace.firebaseapp.com",
  databaseURL: "https://medisync-c2ace-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "medisync-c2ace",
  storageBucket: "medisync-c2ace.firebasestorage.app",
  messagingSenderId: "604636007846",
  appId: "1:604636007846:web:17511bdb2ac7313f09d367",
  measurementId: "G-4PCFWDQJS5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

export { app, analytics, database, storage, firestore };
export default app;
