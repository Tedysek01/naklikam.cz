import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

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
    if (!stripe) {
      console.error('STRIPE_SECRET_KEY not configured')
      return res.status(500).json({ error: 'Stripe not configured' })
    }

    const { customerId, userId } = req.body

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' })
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId for verification' })
    }

    // Only retrieve existing customer, NEVER create new ones
    let customer
    try {
      // Try to get customer by Stripe customer ID
      customer = await stripe.customers.retrieve(customerId)
      
      // CRITICAL SECURITY CHECK: Verify the customer belongs to the requesting user
      if (customer.metadata?.userId && customer.metadata.userId !== userId) {
        console.error(`SECURITY WARNING: User ${userId} attempted to access portal for customer ${customerId} belonging to user ${customer.metadata.userId}`)
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this billing portal'
        })
      }
    } catch (error) {
      console.error(`Customer not found: ${customerId} for user ${userId}`)
      return res.status(404).json({ 
        error: 'Customer not found',
        message: 'No billing account found. Please contact support if you believe this is an error.'
      })
    }

    // Create portal session with configuration
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${req.headers.origin || 'https://www.naklikam.cz'}/dashboard`,
      configuration: undefined, // Use default configuration (can be customized)
    })

    console.log(`Created portal session for customer ${customer.id} (user: ${userId})`)

    return res.status(200).json({
      url: portalSession.url
    })

  } catch (error) {
    console.error('Error creating portal session:', error)
    return res.status(500).json({ 
      error: 'Failed to create portal session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}