import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBodv19Ff5lQTdAidSvGSrMmMf3k1LIHTk",
  authDomain: "memorynest-4f233.firebaseapp.com",
  projectId: "memorynest-4f233",
  storageBucket: "memorynest-4f233.firebasestorage.app",
  messagingSenderId: "223599292457",
  appId: "1:223599292457:web:1ef8504c34e8f3890fec38"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);