// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_2syjWx4MhXdtiMF73ClXcfU_TncJIXo",
  authDomain: "kulesend-kuledever.firebaseapp.com",
  databaseURL: "https://kulesend-kuledever-default-rtdb.firebaseio.com",
  projectId: "kulesend-kuledever",
  storageBucket: "kulesend-kuledever.firebasestorage.app",
  messagingSenderId: "376216967501",
  appId: "1:376216967501:web:b567aaf0d5e1b8d516ff04",
  measurementId: "G-Y5Z0ZJH2N7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);