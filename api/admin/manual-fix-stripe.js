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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { adminUserId, adminEmail } = req.body;
  const ADMIN_USERS = ['1Malqb8csrZ0Sy38lV0S0Sv3Adi2'];
  const ADMIN_EMAILS = ['tadeas@raska.eu', 'admin@naklikam.cz'];
  
  if (!ADMIN_USERS.includes(adminUserId) && !ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔧 Starting manual fix of Stripe Customer IDs...');
    
    // Manual mapping of problematic users to their correct customer IDs
    const fixes = [
      { userId: 'RNFmK1KP4RVTG2TXfVBqjIETbrb2', correctCustomerId: 'cus_SuTRt6KauGo5F2' },
      { userId: 'an1I8A3bg1SAIybp9gsOvx5YLDP2', correctCustomerId: 'cus_Sv1tZP7PW96Xtq' },
      { userId: '361e8wR7FTb4Ggu3mrdjPvOve8s1', correctCustomerId: 'cus_SvBYXFwEUdM2jA' },
      { userId: 'ni95bPA60Ia6t6woMbcKJHQ6SPB2', correctCustomerId: 'cus_Su7BHvvRJNPw74' },
      { userId: 'HwZmBjF8w2ZQKQvDkA01O3KnxwV2', correctCustomerId: 'cus_SuGdODuKgOXCiB' },
      { userId: 'z81jIqv6p0VRGFBT12tDHDpw6O03', correctCustomerId: 'cus_Ssw3NlRixKNBbe' },
      { userId: 'q0NI1CnenEVhh4a6y0HNyg8ByK13', correctCustomerId: 'cus_StaMD5XIRKyCu6' },
      { userId: 'IWQmpkus2gSUjuVzgN1oPaCTZJe2', correctCustomerId: 'cus_Su6sYA0fTiHEz7' },
      { userId: 'fOwVgvXULiVQbJ2rm62SX1aHJGr2', correctCustomerId: 'cus_SsVo1xBRdp4Gtg' },
      { userId: 'etWOScKHmvYcF6N2RvEB3tdo64H3', correctCustomerId: 'cus_SroC72F0e8Kcyk' },
      { userId: 'TSulZM1L9ZTlF4ZZWfE4BADGx4x1', correctCustomerId: 'cus_SqhTJXiDAh3pkF' },
      { userId: '5HtJRyHpAgVhlK2vksXGdrde3SQ2', correctCustomerId: 'cus_SsXEsAQQs4bI1a' },
      { userId: 'JZzYlub9OngJ4HU9ozZuQGA19bQ2', correctCustomerId: 'cus_Ss2j6FtLUDNoCP' },
      { userId: 'I1hBmCbCwhWF0ElKDby2pw0SxbW2', correctCustomerId: 'cus_Sqi6p2jeeSAmtP' },
      { userId: 'knSCyFwqx4S5ArOZseI3f7O4LHi1', correctCustomerId: 'cus_Ssa1ynmUkfb2zQ' },
      { userId: 'InMlEb4SYlhAzm3Y5xSyHHj3Bmw1', correctCustomerId: 'cus_SqK5vyP1PdvJHl' },
      { userId: 'mbd6aIT5V4gFEOD6FmjX5y78XhO2', correctCustomerId: 'cus_SqxCwoAEDtg27j' }
    ];

    const db = await getAdminDb();
    
    let fixed = 0;
    let notFound = 0;
    let alreadyCorrect = 0;
    const fixedUsers = [];

    for (const fix of fixes) {
      try {
        // Check if subscription exists
        const subscriptionDoc = await db.collection('users').doc(fix.userId).collection('subscription').doc('current').get();
        
        if (subscriptionDoc.exists) {
          const currentData = subscriptionDoc.data();
          const currentCustomerId = currentData.stripeCustomerId;
          
          if (currentCustomerId !== fix.correctCustomerId) {
            // Update with correct customer ID
            await db.collection('users').doc(fix.userId).collection('subscription').doc('current').update({
              stripeCustomerId: fix.correctCustomerId,
              updatedAt: new Date()
            });
            
            console.log(`✅ Fixed ${fix.userId}: ${currentCustomerId || 'missing'} → ${fix.correctCustomerId}`);
            
            fixedUsers.push({
              userId: fix.userId,
              old: currentCustomerId || 'missing',
              new: fix.correctCustomerId
            });
            
            fixed++;
          } else {
            console.log(`✓ Already correct ${fix.userId}: ${currentCustomerId}`);
            alreadyCorrect++;
          }
        } else {
          console.log(`⚠️ No subscription found for ${fix.userId}`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${fix.userId}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalToFix: fixes.length,
        fixed,
        alreadyCorrect,
        notFound
      },
      fixedUsers
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fix users',
      message: error.message 
    });
  }
}