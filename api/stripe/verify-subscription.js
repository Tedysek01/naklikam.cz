const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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

    // Find customer by userId in metadata
    const customers = await stripe.customers.list({ limit: 100 })
    const customer = customers.data.find(c => c.metadata?.userId === userId)
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'No Stripe customer found',
        userId,
        totalCustomers: customers.data.length
      })
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    })

    if (subscriptions.data.length === 0) {
      return res.status(200).json({ 
        message: 'No active subscription found',
        customer: customer.id
      })
    }

    const subscription = subscriptions.data[0]
    const priceId = subscription.items.data[0]?.price?.id
    
    console.log('Subscription debug:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      current_period_end_type: typeof subscription.current_period_end,
      items: subscription.items.data.length
    })
    
    const PRICE_TO_PLAN = {
      'price_1Ru0FwLArwl6e4M5oUZrb65n': 'trial', // Trial plan - 70 CZK, 100k tokens
      'price_1RqZh9LArwl6e4M5oVw9Vyz3': 'starter',
      'price_1RqZhZLArwl6e4M5mbLPPcfK': 'professional', 
      'price_1RqZj6LArwl6e4M5qLGicRkl': 'business',
      'price_1RqZn2LArwl6e4M5BOAkMe0H': 'unlimited'
    }
    
    const plan = PRICE_TO_PLAN[priceId] || 'starter'

    return res.status(200).json({
      success: true,
      message: `Active ${plan} subscription found!`,
      subscription: {
        id: subscription.id,
        plan,
        priceId,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        customer: customer.id
      }
    })

  } catch (error) {
    console.error('Error verifying subscription:', error)
    return res.status(500).json({ 
      error: 'Failed to verify subscription',
      message: error.message
    })
  }
}