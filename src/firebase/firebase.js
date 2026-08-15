import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxVMQ_HmcoYKxWBY30eOYTdPTprJ6da94",
  authDomain: "real-chat-6c2be.firebaseapp.com",
  projectId: "real-chat-6c2be",
  storageBucket: "real-chat-6c2be.firebasestorage.app",
  messagingSenderId: "1068017172321",
  appId: "1:1068017172321:web:c3a8e37cea315af203cf20",
  measurementId: "G-M38JSWTXQR",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);