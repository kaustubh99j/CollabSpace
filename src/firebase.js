import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyDVI6lRRZCf_bxpAchiubEP0lDCMYgfn20",
  authDomain: "collabspace-a55ec.firebaseapp.com",
  projectId: "collabspace-a55ec",
  storageBucket: "collabspace-a55ec.firebasestorage.app",
  messagingSenderId: "988188542118",
  appId: "1:988188542118:web:8fb7f5932c9b5d7c41a067",
  measurementId: "G-9JBRX040C5"
};

const firebaseApp = firebase.initializeApp(firebaseConfig)
const db = firebaseApp.firestore();
const auth = firebase.auth();
const storage = firebaseApp.storage();
const provider = new firebase.auth.GoogleAuthProvider();

export {auth, db, storage, provider};
