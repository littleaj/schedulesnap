import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// cSpell:disable
const firebaseConfig = {
  apiKey: "AIzaSyBQbZCx8EIvV7VhyNzjdQxp8xJyFoRuevU",
  authDomain: "schedulesnap-4f86c.firebaseapp.com",
  projectId: "schedulesnap-4f86c",
  storageBucket: "schedulesnap-4f86c.firebasestorage.app",
  messagingSenderId: "453994861265",
  appId: "1:453994861265:web:478635912742dcddbcebf0",
  measurementId: "G-HB7CBPZJRZ"
};
// cSpell:enable

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

const node = document.getElementById('root');
if (!node) throw new Error('Root node not found!');

const root = createRoot(node);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
