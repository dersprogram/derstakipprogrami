import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAdBlDKxuP6dNmJZGeRgc7axyarXWxTuFg",
  authDomain: "derstakipprogrami.firebaseapp.com",
  databaseURL: "https://derstakipprogrami-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "derstakipprogrami",
  storageBucket: "derstakipprogrami.firebasestorage.app",
  messagingSenderId: "1050538232596",
  appId: "1:1050538232596:web:c6b37c4307c8c8302c5001"
};

const PLACEHOLDER_VALUES = [
  "YOUR_API_KEY",
  "YOUR_AUTH_DOMAIN",
  "YOUR_PROJECT_ID",
  "YOUR_STORAGE_BUCKET",
  "YOUR_MESSAGING_SENDER_ID",
  "YOUR_APP_ID"
];

const hasPlaceholderConfig = Object.values(firebaseConfig).some(function(value){
  return PLACEHOLDER_VALUES.includes(String(value || "").trim());
});

if(hasPlaceholderConfig){
  console.warn("Firebase config doldurulmalı");
}

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});
window.AppAuth = auth;