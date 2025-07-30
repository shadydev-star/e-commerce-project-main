// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFvurKuRryZnlErl2x-VUXmoj4Zpsfkp4",
  authDomain: "wild--ecommerce.firebaseapp.com",
  projectId: "wild--ecommerce",
  storageBucket: "wild--ecommerce.appspot.com",
  messagingSenderId: "635520395439",
  appId: "1:635520395439:web:8e6aa847074020e3304c5a",
  measurementId: "G-169QH3MRHX"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, ref }; // 👈 ADD ref HERE
