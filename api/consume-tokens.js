import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // For Vercel, we need to provide credentials differently
    const projectId = process.env.FIREBASE_PROJECT_ID || 'lovable-clone';
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // If we have a service account key (recommended for production)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
    } else {
      // Fallback - this might not work on Vercel without credentials
      admin.initializeApp({
        projectId: projectId
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, tokens } = req.body;
    
    if (!userId || !tokens) {
      return res.status(400).json({ error: 'Missing userId or tokens' });
    }

    // Get current subscription
    const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    
    const subscription = subscriptionDoc.data();
    const newTokensUsed = (subscription.tokensUsed || 0) + tokens;
    
    // Check if user has enough tokens
    if (subscription.plan !== 'unlimited' && newTokensUsed > subscription.tokensLimit) {
      return res.status(403).json({ 
        error: 'Insufficient tokens',
        tokensUsed: subscription.tokensUsed,
        tokensLimit: subscription.tokensLimit,
        requested: tokens
      });
    }
    
    // Update token usage
    await subscriptionRef.update({
      tokensUsed: newTokensUsed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return updated subscription data
    const updatedDoc = await subscriptionRef.get();
    const updatedData = updatedDoc.data();
    
    res.status(200).json({
      success: true,
      subscription: {
        plan: updatedData.plan,
        tokens: updatedData.tokens,
        tokensUsed: updatedData.tokensUsed,
        tokensLimit: updatedData.tokensLimit,
        expiresAt: updatedData.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error consuming tokens:', error);
    res.status(500).json({ 
      error: 'Failed to consume tokens',
      details: error.message 
    });
  }
}