import Stripe from 'stripe';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id parameter' });
  }

  if (!stripe) {
    console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    // Get checkout session details
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'subscription']
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get line item details
    const lineItem = session.line_items?.data?.[0];
    const price = lineItem?.price;
    
    // Map price ID to plan
    const PRICE_TO_PLAN = {
      'price_1Ru0FwLArwl6e4M5oUZrb65n': 'trial',
      'price_1RqZh9LArwl6e4M5oVw9Vyz3': 'starter', 
      'price_1RqZhZLArwl6e4M5mbLPPcfK': 'professional',
      'price_1RqZj6LArwl6e4M5qLGicRkl': 'business',
      'price_1RqZn2LArwl6e4M5BOAkMe0H': 'unlimited'
    };

    const plan = PRICE_TO_PLAN[price?.id] || 'unknown';
    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents to CZK
    
    const sessionDetails = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      plan,
      amount,
      currency: session.currency?.toUpperCase() || 'CZK',
      subscriptionId: session.subscription,
      createdAt: new Date(session.created * 1000).toISOString()
    };

    res.json(sessionDetails);

  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session details',
      message: error.message 
    });
  }
}