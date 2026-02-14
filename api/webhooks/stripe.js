import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  try {
    // Handle different private key formats
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Remove quotes if present
    if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey?.replace(/\\n/g, '\n');
    
    console.log('🔑 Private key check:', {
      hasKey: !!privateKey,
      startsWithBegin: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
      endsWithEnd: privateKey?.endsWith('-----END PRIVATE KEY-----'),
      length: privateKey?.length
    });
    
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized in webhook');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const adminDb = getFirestore();

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
}) : null;

// Disable body parsing for webhook endpoints
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Get raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log('✅ Stripe webhook signature verified:', event.type);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        await handlePaymentSucceeded(paymentIntent);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('📄 Invoice payment succeeded:', invoice.id);
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('❌ Invoice payment failed:', failedInvoice.id);
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('🎉 Subscription created:', subscription.id);
        await handleSubscriptionCreated(subscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('🔄 Subscription updated:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('🛒 Checkout session completed:', session.id);
        await handleCheckoutSessionCompleted(session);
        break;

      case 'customer.updated':
        const customer = event.data.object;
        console.log('👤 Customer updated:', customer.id);
        await handleCustomerUpdated(customer);
        break;

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Webhook handler functions
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Processing successful payment:', paymentIntent.id);
  
  const customerId = paymentIntent.customer;
  const amount = paymentIntent.amount;
  const currency = paymentIntent.currency;
  
  console.log(`Payment processed: ${amount} ${currency} for customer ${customerId}`);
  
  // TODO: Update user subscription in Firebase
  // await updateUserSubscription(customerId, { status: 'active', amount, currency });
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing successful invoice payment:', invoice.id);

  const customerId = invoice.customer;
  // Handle different API versions for subscription field
  const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  const amount = invoice.amount_paid;
  const billingReason = invoice.billing_reason;

  console.log(`📄 Invoice details:`, {
    id: invoice.id,
    customer: customerId,
    subscription: subscriptionId,
    amount: amount,
    billingReason,
    hasSubscription: !!subscriptionId
  });

  // Only process subscription renewals, not one-time payments
  if (subscriptionId && billingReason === 'subscription_cycle') {
    console.log('🔄 This is a subscription renewal - processing...', { subscriptionId });
    try {
      // Get customer to find userId
      const customer = await stripe.customers.retrieve(customerId);
      const userId = customer.metadata?.userId || customerId;

      console.log(`🔄 Processing renewal for user ${userId}`);

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Get current subscription data from Firebase
      const subscriptionDoc = await adminDb.collection('users').doc(userId).collection('subscription').doc('current').get();

      if (subscriptionDoc.exists) {
        const currentData = subscriptionDoc.data();
        // Create timestamps properly for Firestore
        const now = new Date();
        const expirationDate = new Date(subscription.current_period_end * 1000);

        const updates = {
          // Reset tokens for web plans
          tokensUsed: 0,
          lastResetAt: now,

          // Update expiration date
          expiresAt: expirationDate,

          // Keep track of renewal
          lastRenewalAt: now,
          renewalCount: (currentData.renewalCount || 0) + 1,

          updatedAt: now
        };

        // Reset content credits if user has content plan or addon
        if (currentData.credits !== undefined || currentData.contentAddon) {
          let totalCredits = 0;

          // Calculate total credits from subscription items
          for (const item of subscription.items.data) {
            const priceId = item.price.id;
            const contentCredits = CONTENT_PRICE_TO_CREDITS[priceId];
            if (contentCredits) {
              totalCredits += contentCredits;
              console.log(`  Adding ${contentCredits} credits from ${priceId}`);
            }
          }

          if (totalCredits > 0) {
            updates.credits = totalCredits;
            updates.creditsResetAt = now;
            console.log(`  🎯 Reset credits to ${totalCredits}`);
          }
        }

        // Apply updates with proper error handling
        try {
          await adminDb.collection('users').doc(userId).collection('subscription').doc('current').update(updates);
        } catch (updateError) {
          console.error('Firestore update error:', updateError);
          // Try to fix timestamp issues
          const fixedUpdates = { ...updates };
          Object.keys(fixedUpdates).forEach(key => {
            if (fixedUpdates[key] instanceof Date) {
              console.log(`Converting Date ${key} to Firestore timestamp`);
              // Let Firestore handle the conversion
            }
          });
          await adminDb.collection('users').doc(userId).collection('subscription').doc('current').update(fixedUpdates);
        }

        console.log(`✅ Renewal processed: Reset tokens to 0, updated expiration to ${updates.expiresAt.toLocaleDateString()}`);
        if (updates.credits) {
          console.log(`✅ Reset content credits to ${updates.credits}`);
        }
      } else {
        console.log(`⚠️  No subscription found in Firebase for user ${userId}`);
      }
    } catch (error) {
      console.error('Error processing invoice payment:', error);
    }
  } else {
    console.log(`⏭️  Skipping invoice - not a subscription renewal:`, {
      hasSubscription: !!subscriptionId,
      billingReason,
      isOneTime: !subscriptionId || billingReason !== 'subscription_cycle'
    });
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing failed invoice payment:', invoice.id);
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  console.log(`Invoice payment failed for subscription ${subscriptionId}`);
  
  // TODO: Notify user and possibly suspend subscription
  // await suspendUserSubscription(customerId, subscriptionId);
  // await sendPaymentFailedEmail(customerId);
}

async function handleSubscriptionCreated(subscription) {
  console.log('Processing new subscription:', subscription.id);
  
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id;
  const status = subscription.status;
  
  console.log(`New subscription: ${priceId} status ${status} for customer ${customerId}`);
  
  if (status === 'active') {
    await createUserSubscription(customerId, priceId, subscription);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  const customerId = subscription.customer;
  const status = subscription.status;
  
  // Handle multiple subscription items (base + addon)
  const items = subscription.items.data;
  console.log(`Subscription has ${items.length} items`);
  
  if (status === 'active') {
    // Process each subscription item
    for (const item of items) {
      const priceId = item.price?.id;
      console.log(`Processing item: ${priceId}`);
      
      // Check if this is a content addon
      const contentPlan = CONTENT_PRICE_TO_PLAN[priceId];
      if (contentPlan && contentPlan.isAddon) {
        // This is an addon, process it as part of the subscription
        console.log(`Found content addon: ${contentPlan.type}`);
      }
    }
    
    // Process the main subscription (could include multiple items)
    const mainPriceId = items[0]?.price?.id;
    await createUserSubscription(customerId, mainPriceId, subscription);
    
    // If there are multiple items, process addons
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        const addonPriceId = items[i].price?.id;
        const contentPlan = CONTENT_PRICE_TO_PLAN[addonPriceId];
        if (contentPlan && contentPlan.isAddon) {
          console.log(`Processing addon item: ${contentPlan.type}`);
          await createUserSubscription(customerId, addonPriceId, subscription);
        }
      }
    }
  } else if (status === 'canceled' || status === 'unpaid') {
    await deactivateUserSubscription(customerId);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const customerId = subscription.customer;
  
  console.log(`Subscription deleted for customer ${customerId}`);
  
  // TODO: Deactivate user subscription
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const userId = session.client_reference_id || session.metadata?.userId;
  
  console.log(`Checkout completed - Customer: ${customerId}, Subscription: ${subscriptionId}, User: ${userId}`);
  
  if (subscriptionId) {
    try {
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (priceId) {
        console.log(`🎉 Auto-activating subscription for completed checkout: ${priceId}`);
        await createUserSubscription(customerId, priceId, subscription);
      }
    } catch (error) {
      console.error('Error processing checkout session completed:', error);
    }
  }
}

async function handleCustomerUpdated(customer) {
  console.log('Processing customer update:', customer.id);
  
  const customerId = customer.id;
  const address = customer.address;
  const taxIds = customer.tax_ids;
  const name = customer.name;
  const email = customer.email;
  
  console.log(`Customer updated: ${customerId}`);
  
  if (address) {
    console.log('📍 Billing address updated:', {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country
    });
  }
  
  if (taxIds && taxIds.length > 0) {
    console.log('🏢 Tax IDs updated:', taxIds.map(tax => ({
      type: tax.type,
      value: tax.value
    })));
  }
  
  // TODO: Update user profile with company information
  // This would typically sync the billing address and tax IDs to your database
  // await updateUserBillingInfo(customerId, { address, taxIds, name, email });
}

// Helper functions for database operations
const PRICE_TO_PLAN = {
  // Legacy Price IDs (pro stávající zákazníky)
  'price_1Ru0FwLArwl6e4M5oUZrb65n': 'trial', // Trial plan - 70 CZK, 100k tokens
  'price_1RqZh9LArwl6e4M5oVw9Vyz3': 'starter',
  'price_1RqZhZLArwl6e4M5mbLPPcfK': 'professional', 
  'price_1RqZj6LArwl6e4M5qLGicRkl': 'business',
  'price_1RqZn2LArwl6e4M5BOAkMe0H': 'unlimited',
  
  // Nové Price IDs (pro nové zákazníky) 
  'price_1S3kamLArwl6e4M5RfxxVdzw': 'trial', // Trial plan - 79 CZK, 100k tokens
  'price_1S3kfdLArwl6e4M5gKLnSwQN': 'pro', // Pro plan - 649 CZK, 2M tokens
  'price_1S3kgILArwl6e4M5flCloWyy': 'business', // Business plan - 1390 CZK, 5M tokens
  
  // Annual Price IDs
  'price_1S3ki9LArwl6e4M5PgZcb4oD': 'pro', // Pro Annual - 6490 CZK/rok
  'price_1S3kiqLArwl6e4M5NeUWJaKZ': 'business', // Business Annual - 13900 CZK/rok
  'price_1S3kjoLArwl6e4M5B6UO9FHz': 'unlimited' // Unlimited Annual - 49700 CZK/rok
};

// Content price to credits mapping for renewal
const CONTENT_PRICE_TO_CREDITS = {
  // Standalone Content Plans
  'price_1S4lrjLArwl6e4M5La8iWDSj': 100, // Content Starter
  'price_1S4lsZLArwl6e4M5BNvNzEkW': 300, // Content Pro
  'price_1S4ltFLArwl6e4M5xu17MKv8': 1000, // Content Business

  // Content Addons
  'price_1S4lu3LArwl6e4M5jZO0BUr5': 100, // Content Basic Addon
  'price_1S4lvbLArwl6e4M5p8vOlX7i': 300, // Content Pro Addon
  'price_1S4lwCLArwl6e4M5IA0MBFR6': 1000 // Content Business Addon
};

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
};

const PLAN_LIMITS = {
  trial: 100000, // 100k tokens
  starter: 2000000, // 2M tokens (legacy)
  professional: 5000000, // 5M tokens (legacy)  
  pro: 2000000, // 2M tokens (nový)
  business: 5000000, // 5M tokens (nový)
  unlimited: -1 // Unlimited
};

async function createUserSubscription(customerId, priceId, subscription) {
  try {
    // Get customer to find userId in metadata
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.userId || customerId;
    
    // Get price details to read metadata
    const price = await stripe.prices.retrieve(priceId);
    const priceMetadata = price.metadata || {};
    
    // Check if this is a content plan
    const contentPlan = CONTENT_PRICE_TO_PLAN[priceId];
    
    if (contentPlan) {
      // Handle Content Plan or Addon
      console.log(`Processing Content ${contentPlan.isAddon ? 'Addon' : 'Plan'}: ${contentPlan.type}`);
      
      // Get existing subscription to preserve data and add addon if needed
      const existingDoc = await adminDb.collection('users').doc(userId).collection('subscription').doc('current').get();
      
      if (contentPlan.isAddon) {
        // This is a Content Addon - add to existing subscription
        if (!existingDoc.exists) {
          console.error('Cannot add content addon without base subscription');
          return;
        }
        
        const existingData = existingDoc.data();
        const baseCredits = existingData.credits || 0;
        
        // Update subscription with content addon
        const updatedData = {
          ...existingData,
          credits: baseCredits + contentPlan.credits, // Add addon credits to base
          contentAddon: {
            plan: contentPlan.type,
            credits: contentPlan.credits,
            stripeSubscriptionItemId: subscription.items?.data?.find(item => item.price.id === priceId)?.id,
            stripePriceId: priceId,
            active: true
          },
          updatedAt: new Date()
        };
        
        await adminDb.collection('users').doc(userId).collection('subscription').doc('current').set(updatedData);
        console.log(`✅ Content Addon ${contentPlan.type} added for user ${userId}`);
        
      } else {
        // This is a standalone Content subscription
        const subscriptionData = {
          plan: contentPlan.type,
          credits: contentPlan.credits,
          isContentOnly: true,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          billingCycle: 'monthly',
          expiresAt: new Date(subscription.current_period_end * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // If user already has a web subscription, merge them
        if (existingDoc.exists) {
          const existingData = existingDoc.data();
          subscriptionData.plan = existingData.plan; // Keep web plan as primary
          subscriptionData.tokens = existingData.tokens;
          subscriptionData.tokensUsed = existingData.tokensUsed || 0;
          subscriptionData.tokensLimit = existingData.tokensLimit;
          subscriptionData.contentPlan = contentPlan.type;
          subscriptionData.credits = contentPlan.credits;
          subscriptionData.isContentOnly = false;
        }
        
        await adminDb.collection('users').doc(userId).collection('subscription').doc('current').set(subscriptionData);
        console.log(`✅ Content subscription ${contentPlan.type} created for user ${userId}`);
      }
      
    } else {
      // Handle regular Web Plan subscription
      const plan = PRICE_TO_PLAN[priceId] || 'starter';
      const tokensLimit = PLAN_LIMITS[plan];
      const isAnnual = priceMetadata.billing_cycle === 'annual';
      
      console.log(`Creating subscription for user ${userId}, plan: ${plan}, tokens: ${tokensLimit}, annual: ${isAnnual}`);
      console.log('Price metadata:', priceMetadata);
      
      // Check if subscription already exists to preserve tokensUsed and content addon
      const existingDoc = await adminDb.collection('users').doc(userId).collection('subscription').doc('current').get();
      let tokensUsed = 0;
      let createdAt = new Date();
      let contentAddon = null;
      let baseCredits = 0;
      
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        tokensUsed = existingData.tokensUsed || 0;
        createdAt = existingData.createdAt || new Date();
        contentAddon = existingData.contentAddon || null;
        baseCredits = existingData.contentAddon?.credits || 0;
        console.log('📊 Found existing subscription, preserving tokensUsed:', tokensUsed);
      }
      
      // Web plans don't have credits by default - only Content plans/addons have credits
      const planCredits = 0; // Web plans have 0 credits
      
      const subscriptionData = {
        plan,
        tokens: tokensLimit === -1 ? 999999999 : tokensLimit, // Large number for unlimited
        tokensUsed,
        tokensLimit: tokensLimit === -1 ? -1 : tokensLimit,
        credits: planCredits + baseCredits, // Only addon credits if any
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        billingCycle: isAnnual ? 'annual' : 'monthly',
        isLegacyPricing: !priceMetadata.plan_name, // Legacy prices nemají metadata
        expiresAt: new Date(subscription.current_period_end * 1000),
        createdAt: createdAt,
        updatedAt: new Date(),
        // Preserve content addon if exists
        ...(contentAddon && { contentAddon }),
        // Přidej metadata pro debug
        priceMetadata: priceMetadata
      };
      
      // Save to Firestore
      await adminDb.collection('users').doc(userId).collection('subscription').doc('current').set(subscriptionData);
      
      console.log(`✅ Subscription created successfully for user ${userId}`);
    }
  } catch (error) {
    console.error('Error creating user subscription:', error);
  }
}

async function deactivateUserSubscription(customerId) {
  try {
    // Get customer to find userId
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.userId || customerId;
    
    console.log(`Deactivating subscription for user ${userId}`);
    
    // Delete subscription document
    await adminDb.collection('users').doc(userId).collection('subscription').doc('current').delete();
    
    console.log(`✅ Subscription deactivated for user ${userId}`);
  } catch (error) {
    console.error('Error deactivating subscription:', error);
  }
}