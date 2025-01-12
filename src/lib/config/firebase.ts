import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator  } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";



// Define your Firebase configuration
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Ensure Firebase is initialized exactly once
const app: FirebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to Firestore emulator if running locally
if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true") {
  console.log("Connecting to Firestore Emulator...");
  connectFirestoreEmulator(db, "localhost", 8080); // Adjust port if needed
  console.log("Connecting to Storage Emulator...");
  connectStorageEmulator(storage, "localhost", 9199); // Adjust port if needed
}

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure providers
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export {
  app,
  auth,
  db,
  storage,
  googleProvider,
  facebookProvider,
};
