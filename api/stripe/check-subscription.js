const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const PRICE_TO_PLAN = {
  'price_1Ru0FwLArwl6e4M5oUZrb65n': 'trial', // Trial plan - 70 CZK, 100k tokens
  'price_1RqZh9LArwl6e4M5oVw9Vyz3': 'starter',
  'price_1RqZhZLArwl6e4M5mbLPPcfK': 'professional', 
  'price_1RqZj6LArwl6e4M5qLGicRkl': 'business',
  'price_1RqZn2LArwl6e4M5BOAkMe0H': 'unlimited'
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    console.log(`🔍 Checking subscription for user: ${userId}`)

    // Find customer by userId in metadata
    const customers = await stripe.customers.list({
      limit: 100,
    })

    console.log(`📊 Found ${customers.data.length} customers`)
    
    const customer = customers.data.find(c => c.metadata?.userId === userId)
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'No Stripe customer found',
        debug: {
          userId,
          totalCustomers: customers.data.length,
          customers: customers.data.map(c => ({
            id: c.id,
            email: c.email,
            metadata: c.metadata
          }))
        }
      })
    }

    console.log(`✅ Found customer: ${customer.id}`)

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      return res.status(200).json({ 
        message: 'No active subscriptions found',
        customer: {
          id: customer.id,
          email: customer.email,
          metadata: customer.metadata
        }
      })
    }

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price?.id
    const plan = PRICE_TO_PLAN[priceId] || 'starter'

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        metadata: customer.metadata
      },
      subscription: {
        id: subscription.id,
        plan,
        priceId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error checking subscription:', error)
    return res.status(500).json({ 
      error: 'Failed to check subscription',
      message: error.message
    })
  }
}