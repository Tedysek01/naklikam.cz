const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

let adminDb = null

// Initialize Firebase Admin only when needed
async function getAdminDb() {
  if (adminDb) return adminDb
  
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app')
    const { getFirestore } = require('firebase-admin/firestore')
    
    if (!getApps().length) {
      console.log('🔧 Initializing Firebase Admin...')
      // Handle different private key formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY
      
      // Remove quotes if present
      if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
        privateKey = privateKey.slice(1, -1)
      }
      
      // Replace escaped newlines with actual newlines
      privateKey = privateKey?.replace(/\\n/g, '\n')
      
      console.log('🔑 Private key check:', {
        hasKey: !!privateKey,
        startsWithBegin: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithEnd: privateKey?.endsWith('-----END PRIVATE KEY-----'),
        length: privateKey?.length,
        firstChars: privateKey?.substring(0, 30),
        lastChars: privateKey?.substring(privateKey.length - 30)
      })
      
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
      console.log('✅ Firebase Admin initialized')
    }
    
    adminDb = getFirestore()
    return adminDb
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error)
    throw new Error(`Firebase init failed: ${error.message}`)
  }
}

const PRICE_TO_PLAN = {
  'price_1Ru0FwLArwl6e4M5oUZrb65n': 'trial', // Trial plan - 70 CZK, 100k tokens
  'price_1RqZh9LArwl6e4M5oVw9Vyz3': 'starter',
  'price_1RqZhZLArwl6e4M5mbLPPcfK': 'professional', 
  'price_1RqZj6LArwl6e4M5qLGicRkl': 'business',
  'price_1RqZn2LArwl6e4M5BOAkMe0H': 'unlimited'
}

const PLAN_LIMITS = {
  trial: 100000, // 100k tokens
  starter: 2000000, // 2M tokens
  professional: 5000000, // 5M tokens
  business: 10000000, // 10M tokens
  unlimited: -1 // Unlimited
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured')
      return res.status(500).json({ error: 'Stripe not configured' })
    }

    console.log(`Syncing subscription for user: ${userId}`)

    // Find customer by userId in metadata
    const customers = await stripe.customers.list({
      limit: 100,
    })

    const customer = customers.data.find(c => c.metadata?.userId === userId)
    
    console.log(`🔍 Searching for customer with userId: ${userId}`)
    console.log(`📊 Found ${customers.data.length} total customers in Stripe`)
    console.log('👥 All customers:', customers.data.map(c => ({ 
      id: c.id, 
      email: c.email,
      created: new Date(c.created * 1000).toISOString(),
      metadata: c.metadata 
    })))
    
    // Try to find by userId in metadata
    const customersByUserId = customers.data.filter(c => c.metadata?.userId === userId)
    console.log(`🎯 Customers matching userId ${userId}:`, customersByUserId.length)
    
    if (!customer) {
      console.log(`No Stripe customer found for user ${userId}`)
      return res.status(404).json({ error: 'No Stripe customer found' })
    }

    console.log(`Found customer: ${customer.id}`)

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      console.log(`No active subscriptions found for customer ${customer.id}`)
      // Delete any existing subscription in Firestore
      const db = await getAdminDb()
      await db.collection('users').doc(userId).collection('subscription').doc('current').delete()
      return res.status(200).json({ message: 'No active subscription, removed from database' })
    }

    // Get the first active subscription
    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price?.id
    const plan = PRICE_TO_PLAN[priceId] || 'starter'
    const tokensLimit = PLAN_LIMITS[plan]

    console.log(`Active subscription found: ${subscription.id}, plan: ${plan}`)

    const subscriptionData = {
      plan,
      tokens: tokensLimit === -1 ? 999999999 : tokensLimit, // Large number for unlimited
      tokensUsed: 0, // Keep existing usage or reset to 0
      tokensLimit: tokensLimit === -1 ? -1 : tokensLimit,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      expiresAt: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days if missing
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      // Check if subscription already exists to preserve tokensUsed
      console.log('🔥 Getting Firebase Admin DB...')
      const db = await getAdminDb()
      
      console.log('📄 Checking existing subscription doc...')
      const existingDoc = await db.collection('users').doc(userId).collection('subscription').doc('current').get()
      
      if (existingDoc.exists) {
        const existingData = existingDoc.data()
        subscriptionData.tokensUsed = existingData.tokensUsed || 0
        subscriptionData.createdAt = existingData.createdAt || new Date()
        console.log('📊 Found existing subscription, preserving tokensUsed:', existingData.tokensUsed)
      }

      console.log('💾 Saving subscription to Firestore...')
      await db.collection('users').doc(userId).collection('subscription').doc('current').set(subscriptionData)
      console.log('✅ Saved successfully!')
      
    } catch (firebaseError) {
      console.error('❌ Firebase operation failed:', firebaseError)
      console.error('Firebase error details:', {
        message: firebaseError.message,
        code: firebaseError.code,
        stack: firebaseError.stack
      })
      throw firebaseError
    }

    console.log(`✅ Subscription synced successfully for user ${userId}`)

    return res.status(200).json({
      message: 'Subscription synced successfully',
      subscription: {
        plan: subscriptionData.plan,
        tokensUsed: subscriptionData.tokensUsed,
        tokensLimit: subscriptionData.tokensLimit,
        expiresAt: subscriptionData.expiresAt.toISOString(),
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId
      }
    })

  } catch (error) {
    console.error('❌ Error syncing subscription:', error)
    console.error('Error stack:', error.stack)
    console.error('Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
    })
    return res.status(500).json({ 
      error: 'Failed to sync subscription',
      message: error.message,
      details: error.message
    })
  }
}