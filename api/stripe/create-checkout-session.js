import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { priceId, userId } = req.body

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' })
    }

    // Get plan name from price ID
    const planName = PRICE_TO_PLAN[priceId] || 'unknown'

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured')
      return res.status(500).json({ error: 'Stripe not configured' })
    }

    // Find or create customer
    let customerId = null
    try {
      // Try to find existing customer by userId in metadata
      const customers = await stripe.customers.list({
        limit: 10,
      })
      
      const existingCustomer = customers.data.find(c => c.metadata?.userId === userId)
      
      if (existingCustomer) {
        customerId = existingCustomer.id
        console.log(`Found existing customer: ${customerId} for user ${userId}`)
      } else {
        // Create new customer with userId in metadata
        const customerData = {
          metadata: {
            userId: userId,
            planName: planName
          }
        }
        
        // Only add email if provided
        if (req.body.customerEmail) {
          customerData.email = req.body.customerEmail
        }
        
        const newCustomer = await stripe.customers.create(customerData)
        customerId = newCustomer.id
        console.log(`Created new customer: ${customerId} for user ${userId}`)
      }
    } catch (error) {
      console.error('Error handling customer:', error)
      // Continue without customer - let Stripe create one automatically
    }

    // Create checkout session
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || 'https://www.naklikam.cz'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.naklikam.cz'}/pricing`,
      // Branding and appearance
      ui_mode: 'hosted',
      locale: 'cs', // Czech language
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planName: planName,
        priceId: priceId
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planName: planName,
          priceId: priceId
        },
      },
      // customer_email will be set conditionally below
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'required', // Collect billing address
      tax_id_collection: {
        enabled: true, // Automatically collect tax IDs (DIČ/IČO for Czech companies)
      },
      // automatic_tax: {
      //   enabled: true, // Enable automatic tax calculation for EU VAT - disabled due to customer address requirements
      // },
      customer_update: {
        address: 'auto', // Save address from checkout to customer
        name: 'auto' // Save name from checkout to customer
      },
      // invoice_creation not needed in subscription mode - invoices are created automatically
    }

    // Add customer if we found/created one, otherwise use customer_email
    if (customerId) {
      sessionConfig.customer = customerId
    } else if (req.body.customerEmail) {
      sessionConfig.customer_email = req.body.customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log(`Created checkout session ${session.id} for user ${userId}`)

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    console.error('Request body:', req.body)
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      stack: error.stack
    })
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      type: error.type,
      details: error.message
    })
  }
}