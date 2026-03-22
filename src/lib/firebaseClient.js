import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAToFz3338Augass5dEGrbCChFrpN1oE0Q",
    authDomain: "faturacartoes-248b2.firebaseapp.com",
    projectId: "faturacartoes-248b2",
    storageBucket: "faturacartoes-248b2.firebasestorage.app",
    messagingSenderId: "762523746555",
    appId: "1:762523746555:web:a58a7f0fc28fcf90d2305e",
    measurementId: "G-F0JE8D6CQ7"
};

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
