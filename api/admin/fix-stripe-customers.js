const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

let adminDb = null;

// Initialize Firebase Admin only when needed
async function getAdminDb() {
  if (adminDb) return adminDb;
  
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    
    if (!getApps().length) {
      console.log('🔧 Initializing Firebase Admin...');
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      privateKey = privateKey?.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });
      console.log('✅ Firebase Admin initialized');
    }
    
    adminDb = getFirestore();
    return adminDb;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw new Error(`Firebase init failed: ${error.message}`);
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Simple admin check - you could enhance this
  const { adminUserId, adminEmail } = req.body;
  const ADMIN_USERS = ['1Malqb8csrZ0Sy38lV0S0Sv3Adi2'];
  const ADMIN_EMAILS = ['tadeas@raska.eu', 'admin@naklikam.cz'];
  
  if (!ADMIN_USERS.includes(adminUserId) && !ADMIN_EMAILS.includes(adminEmail)) {
    console.log('Unauthorized access attempt by:', adminUserId, adminEmail);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔍 Starting Stripe Customer ID fix...');
    console.log('Initiated by admin:', adminEmail || adminUserId);
    
    // Get all Stripe customers
    const allCustomers = [];
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      
      const customers = await stripe.customers.list(params);
      allCustomers.push(...customers.data);
      
      hasMore = customers.has_more;
      if (hasMore) {
        startingAfter = customers.data[customers.data.length - 1].id;
      }
    }
    
    console.log(`Found ${allCustomers.length} Stripe customers`);
    
    // Create a map of userId -> stripeCustomerId
    const userToCustomerMap = new Map();
    const duplicates = new Map();
    
    for (const customer of allCustomers) {
      const userId = customer.metadata?.userId;
      if (userId) {
        if (userToCustomerMap.has(userId)) {
          // Found duplicate!
          if (!duplicates.has(userId)) {
            duplicates.set(userId, [userToCustomerMap.get(userId)]);
          }
          duplicates.get(userId).push(customer.id);
          
          // Keep the newer one for now
          const existing = allCustomers.find(c => c.id === userToCustomerMap.get(userId));
          if (customer.created > existing.created) {
            userToCustomerMap.set(userId, customer.id);
          }
        } else {
          userToCustomerMap.set(userId, customer.id);
        }
      }
    }
    
    console.log(`Found ${duplicates.size} users with duplicate customers`);
    
    // Check which customer has active subscriptions
    const userToActiveCustomer = new Map();
    
    for (const [userId, customerIds] of duplicates) {
      for (const customerId of customerIds) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          userToActiveCustomer.set(userId, customerId);
          console.log(`User ${userId}: Found active subscription with ${customerId}`);
          break;
        }
      }
    }
    
    // Update the map with active customers
    for (const [userId, customerId] of userToActiveCustomer) {
      userToCustomerMap.set(userId, customerId);
    }
    
    // Get Firebase admin
    const db = await getAdminDb();
    
    // Get all users from Firebase
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} Firebase users`);
    
    let fixed = 0;
    let missing = 0;
    let correct = 0;
    const fixedUsers = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const subscriptionDoc = await db.collection('users').doc(userId).collection('subscription').doc('current').get();
      
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        const currentStripeCustomerId = subscriptionData.stripeCustomerId;
        const correctStripeCustomerId = userToCustomerMap.get(userId);
        
        if (correctStripeCustomerId) {
          if (currentStripeCustomerId !== correctStripeCustomerId) {
            // Fix incorrect customer ID
            console.log(`Fixing user ${userId}: ${currentStripeCustomerId} -> ${correctStripeCustomerId}`);
            
            await db.collection('users').doc(userId).collection('subscription').doc('current').update({
              stripeCustomerId: correctStripeCustomerId,
              updatedAt: new Date()
            });
            
            fixedUsers.push({
              userId,
              old: currentStripeCustomerId || 'missing',
              new: correctStripeCustomerId
            });
            
            fixed++;
          } else {
            correct++;
          }
        } else if (!currentStripeCustomerId) {
          missing++;
        }
      }
    }
    
    console.log(`✅ Fix completed - Fixed: ${fixed}, Correct: ${correct}, Missing: ${missing}`);
    
    return res.status(200).json({
      success: true,
      summary: {
        totalStripeCustomers: allCustomers.length,
        totalFirebaseUsers: usersSnapshot.size,
        correct,
        fixed,
        missing,
        duplicates: duplicates.size
      },
      fixedUsers,
      duplicateUsers: Array.from(duplicates.entries()).map(([userId, customerIds]) => ({
        userId,
        customerIds,
        activeCustomer: userToActiveCustomer.get(userId)
      }))
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fix Stripe customers',
      message: error.message 
    });
  }
}