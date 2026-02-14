import Stripe from 'stripe';

export default async (req, res) => {
  try {
    console.log('[PAYMENT-HISTORY] Request received')
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    // Get query parameters
    const limit = Math.min(parseInt(req.query.limit) || 100, 500) // Max 500 for performance
    const startingAfter = req.query.starting_after || undefined
    const daysBack = parseInt(req.query.days) || 365

    // Calculate date range
    const sinceTimestamp = Math.floor((Date.now() - (daysBack * 24 * 60 * 60 * 1000)) / 1000)

    console.log(`[PAYMENT-HISTORY] Fetching payments: limit=${limit}, days=${daysBack}`)

    // Get all payment intents from Stripe
    const options = {
      limit,
      created: { gte: sinceTimestamp }
    }
    
    if (startingAfter) {
      options.starting_after = startingAfter
    }

    const paymentIntents = await stripe.paymentIntents.list(options)
    
    console.log(`[PAYMENT-HISTORY] Found ${paymentIntents.data.length} payments`)

    // Format payment data
    const payments = []
    
    for (const payment of paymentIntents.data) {
      // Only include successful payments
      if (payment.status !== 'succeeded') continue

      // Get customer details if available
      let customerEmail = 'Unknown'
      if (payment.customer) {
        try {
          const customer = await stripe.customers.retrieve(payment.customer)
          customerEmail = customer.email || 'Unknown'
        } catch (customerError) {
          console.warn(`[PAYMENT-HISTORY] Could not retrieve customer ${payment.customer}:`, customerError.message)
        }
      }

      // Determine plan from payment description or metadata
      let plan = 'unknown'
      const description = payment.description || ''
      const metadata = payment.metadata || {}
      
      if (description.toLowerCase().includes('hobby') || metadata.plan === 'hobby') {
        plan = 'hobby'
      } else if (description.toLowerCase().includes('starter') || metadata.plan === 'starter') {
        plan = 'starter'
      } else if (description.toLowerCase().includes('professional') || metadata.plan === 'professional') {
        plan = 'professional'  
      } else if (description.toLowerCase().includes('business') || metadata.plan === 'business') {
        plan = 'business'
      } else if (description.toLowerCase().includes('lifetime') || metadata.plan === 'lifetime') {
        plan = 'lifetime'
      }

      payments.push({
        id: payment.id,
        userId: payment.customer || 'unknown',
        userEmail: customerEmail,
        amount: Math.round(payment.amount / 100), // Convert from cents to main currency
        currency: payment.currency.toUpperCase(),
        plan,
        status: payment.status,
        createdAt: new Date(payment.created * 1000).toISOString(),
        stripePaymentIntentId: payment.id,
        description: payment.description || 'Payment'
      })
    }

    // Sort by creation date (newest first)
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log('[PAYMENT-HISTORY] Response ready:', {
      paymentsReturned: payments.length,
      hasMore: paymentIntents.has_more,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0)
    })

    res.json({
      payments,
      pagination: {
        hasMore: paymentIntents.has_more,
        startingAfter: payments.length > 0 ? payments[payments.length - 1].id : null,
        limit
      },
      summary: {
        totalPayments: payments.length,
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        successfulPayments: payments.filter(p => p.status === 'succeeded').length,
        dateRange: {
          from: new Date(sinceTimestamp * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('[PAYMENT-HISTORY] Unexpected error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    })
  }
}