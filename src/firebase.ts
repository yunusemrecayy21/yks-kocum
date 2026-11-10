import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnmTFibXBp7-DfiaIbX7ocRYKOUMnljUk",
  authDomain: "yks-kocum-94469.firebaseapp.com",
  projectId: "yks-kocum-94469",
  storageBucket: "yks-kocum-94469.firebasestorage.app",
  messagingSenderId: "940973256357",
  appId: "1:940973256357:web:5656cbaddd53aded48a74c"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
