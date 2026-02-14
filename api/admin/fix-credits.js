import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Remove quotes if present
    if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey?.replace(/\\n/g, '\n');
    
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const adminDb = getFirestore();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Starting credit fix for all users...');
    
    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();
    let fixed = 0;
    let errors = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        // Get user's subscription
        const subDoc = await adminDb.collection('users').doc(userId).collection('subscription').doc('current').get();
        
        if (subDoc.exists) {
          const subData = subDoc.data();
          
          // Check if user has web plan but incorrect credits
          if (subData.plan && !subData.contentAddon && !subData.isContentOnly) {
            // This is a web-only plan, should have 0 credits
            if (subData.credits && subData.credits > 0) {
              console.log(`Fixing user ${userId}: removing ${subData.credits} credits from web-only plan ${subData.plan}`);
              
              await adminDb.collection('users').doc(userId).collection('subscription').doc('current').update({
                credits: 0
              });
              
              fixed++;
            }
          }
          
          // If user has content addon, ensure credits are correct
          if (subData.contentAddon) {
            const expectedCredits = subData.contentAddon.credits || 0;
            if (subData.credits !== expectedCredits) {
              console.log(`Fixing user ${userId}: setting credits to ${expectedCredits} from content addon`);
              
              await adminDb.collection('users').doc(userId).collection('subscription').doc('current').update({
                credits: expectedCredits
              });
              
              fixed++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        errors++;
      }
    }
    
    console.log(`✅ Credit fix complete. Fixed: ${fixed}, Errors: ${errors}`);
    
    return res.status(200).json({ 
      success: true,
      fixed,
      errors,
      message: `Successfully fixed credits for ${fixed} users` 
    });
    
  } catch (error) {
    console.error('Error fixing credits:', error);
    return res.status(500).json({ 
      error: 'Failed to fix credits',
      message: error.message 
    });
  }
}