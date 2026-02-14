import admin from 'firebase-admin';

// Fix SSL/GRPC issues in serverless environments
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
  process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH:ECDHE:!DH:!aNULL';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  process.env.GOOGLE_CLOUD_PROJECT = process.env.FIREBASE_PROJECT_ID;
  // Disable GRPC verbose logging in production
  process.env.GRPC_VERBOSITY = 'ERROR';
  process.env.GRPC_TRACE = '';
}

let db, auth;

// Initialize Firebase Admin SDK only if not already initialized
try {
  if (!admin.apps.length) {
    // Try to use service account from individual environment variables first
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        universe_domain: "googleapis.com"
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin initialized in api/lib/firebase-admin.js');
    } else if (process.env.VITE_FIREBASE_PROJECT_ID) {
      // Fallback to VITE_ prefixed variables  
      console.log('Warning: Using VITE_ variables for Firebase Admin - this may not work correctly');
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
    }
  }
  
  // Get Firestore and Auth instances with SSL fixes
  db = admin.firestore();
  
  // Apply Firestore settings for serverless compatibility
  try {
    db.settings({
      ssl: true,
      preferRest: true,
      ignoreUndefinedProperties: true
    });
  } catch (settingsError) {
    console.log('Firestore settings already applied or not supported');
  }
  
  auth = admin.auth();
} catch (error) {
  console.error('Firebase Admin initialization error in api/lib/firebase-admin.js:', error.message);
  // Create stub objects to prevent app crash
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ data: () => ({}) }),
        update: async () => ({}),
        add: async () => ({})
      })
    })
  };
  auth = {};
}

export { db, auth };
export default admin;