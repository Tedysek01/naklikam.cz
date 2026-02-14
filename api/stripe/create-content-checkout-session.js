import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' })
    }

    const { 
      priceId, 
      userId, 
      customerEmail, 
      isAddon, 
      planType,
      existingSubscriptionId
    } = req.body

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' })
    }

    // Content plan mapping
    const CONTENT_PRICE_TO_PLAN = {
      // Standalone Content Plans
      'price_1S4lrjLArwl6e4M5La8iWDSj': { type: 'content_starter', credits: 100, isAddon: false },
      'price_1S4lsZLArwl6e4M5BNvNzEkW': { type: 'content_pro', credits: 300, isAddon: false },
      'price_1S4ltFLArwl6e4M5xu17MKv8': { type: 'content_business', credits: 1000, isAddon: false },
      
      // Content Addons
      'price_1S4lu3LArwl6e4M5jZO0BUr5': { type: 'content_basic', credits: 100, isAddon: true },
      'price_1S4lvbLArwl6e4M5p8vOlX7i': { type: 'content_pro', credits: 300, isAddon: true },
      'price_1S4lwCLArwl6e4M5IA0MBFR6': { type: 'content_business', credits: 1000, isAddon: true }
    }

    // Get plan details from price ID
    const planDetails = CONTENT_PRICE_TO_PLAN[priceId]
    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid price ID' })
    }

    // Find or create customer
    let customerId = null
    try {
      // Try to find existing customer by userId in metadata
      const customers = await stripe.customers.list({
        limit: 100,
      })
      
      const existingCustomer = customers.data.find(c => 
        c.metadata?.userId === userId || c.email === customerEmail
      )
      
      if (existingCustomer) {
        customerId = existingCustomer.id
        console.log(`Found existing customer: ${customerId} for user ${userId}`)
      } else {
        // Create new customer with userId in metadata
        const customerData = {
          metadata: {
            userId: userId,
            contentPlan: planDetails.type
          }
        }
        
        // Only add email if provided
        if (customerEmail) {
          customerData.email = customerEmail
        }
        
        const newCustomer = await stripe.customers.create(customerData)
        customerId = newCustomer.id
        console.log(`Created new customer: ${customerId} for user ${userId}`)
      }
    } catch (error) {
      console.error('Error handling customer:', error)
      // Continue without customer - let Stripe create one automatically
    }

    let sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${req.headers.origin || 'https://www.naklikam.cz'}/content-marketing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.naklikam.cz'}/content-marketing`,
      ui_mode: 'hosted',
      locale: 'cs', // Czech language
      client_reference_id: userId,
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'required', // Collect billing address
      tax_id_collection: {
        enabled: true, // Automatically collect tax IDs (DIČ/IČO for Czech companies)
      },
      customer_update: {
        address: 'auto', // Save address from checkout to customer
        name: 'auto' // Save name from checkout to customer
      },
      metadata: {
        userId: userId,
        contentPlan: planDetails.type,
        priceId: priceId,
        isAddon: isAddon ? 'true' : 'false',
        credits: String(planDetails.credits)
      }
    }

    // Handle addon vs standalone subscription
    if (isAddon && existingSubscriptionId) {
      // For addons, we need to update the existing subscription
      // Create a checkout session that will add the addon to existing subscription
      sessionConfig.mode = 'subscription'
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        }
      ]
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
          contentAddon: planDetails.type,
          credits: String(planDetails.credits),
          isAddon: 'true'
        }
      }
      
      // If customer has existing subscription, we should link to it
      if (customerId) {
        sessionConfig.customer = customerId
        
        // Get existing subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        })
        
        if (subscriptions.data.length > 0) {
          // Instead of modifying here, let webhook handle it after payment
          // Store the subscription ID to update in metadata
          sessionConfig.metadata.targetSubscriptionId = subscriptions.data[0].id
        }
      }
    } else {
      // Standalone Content subscription
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        }
      ]
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
          contentPlan: planDetails.type,
          credits: String(planDetails.credits),
          isStandalone: 'true'
        }
      }
      
      if (customerId) {
        sessionConfig.customer = customerId
      }
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log(`Created checkout session ${session.id} for user ${userId}, plan: ${planDetails.type}`)

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