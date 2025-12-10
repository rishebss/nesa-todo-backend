import admin from "firebase-admin";

// Build service account from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Check if Firebase app is already initialized (for hot reloading)
let firebaseApp;
let db;
let auth;

try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin initialized");
  } else {
    firebaseApp = admin.app();
  }
  
  // Initialize Firestore Database
  db = admin.firestore();
  
  // Initialize Firebase Auth (optional, if you need it)
  auth = admin.auth();
  
} catch (error) {
  console.error("❌ Firebase initialization error:", error.message);
  throw error; // Re-throw to handle in server.js
}

// Export initialized services
export { db, auth, firebaseApp };