// Stripe Configuration for Naklikam.cz

// === WEB PLANS ===

// Legacy Price IDs pro stávající zákazníky (staré ceny)
export const LEGACY_PRICE_IDS = {
  trial: 'price_1Ru0FwLArwl6e4M5oUZrb65n', // Trial plan - 70 CZK/month (legacy)
  starter: 'price_1RqZh9LArwl6e4M5oVw9Vyz3', // Starter - 580 CZK
  professional: 'price_1RqZhZLArwl6e4M5mbLPPcfK', // Professional - 1290 CZK
  business: 'price_1RqZj6LArwl6e4M5qLGicRkl', // Business - 2290 CZK (legacy)
  unlimited: 'price_1RqZn2LArwl6e4M5BOAkMe0H' // Unlimited - 4970 CZK
} as const

// Nové Price IDs pro nové zákazníky (nové ceny)
export const NEW_PRICE_IDS = {
  trial: 'price_1S3kamLArwl6e4M5RfxxVdzw', // Trial plan - 79 CZK/month
  pro: 'price_1S3kfdLArwl6e4M5gKLnSwQN', // Pro plan - 649 CZK/month
  business: 'price_1S3kgILArwl6e4M5flCloWyy', // Business plan - 1390 CZK/month
  unlimited: 'price_1RqZn2LArwl6e4M5BOAkMe0H' // Unlimited - 4970 CZK/month (same)
} as const

// Annual Price IDs pro roční předplatné
export const ANNUAL_PRICE_IDS = {
  trial: null, // Trial nemá annual variantu
  pro: 'price_1S3ki9LArwl6e4M5PgZcb4oD', // 6,490 CZK/rok
  business: 'price_1S3kiqLArwl6e4M5NeUWJaKZ', // 13,900 CZK/rok 
  unlimited: 'price_1S3kjoLArwl6e4M5B6UO9FHz' // 49,700 CZK/rok
} as const

// === CONTENT MARKETING PLANS ===

// Content Product IDs
export const CONTENT_PRODUCT_IDS = {
  // Standalone Content Products
  content_starter: 'prod_T0nSKvJYEyA7PP', // Naklikam.cz Content Starter
  content_pro: 'prod_T0nT6yfFQK9f8m', // Naklikam.cz Content Pro
  content_business: 'prod_T0nUgW7wCVmydN', // Naklikam.cz Content Business
  
  // Addon Content Products
  content_basic_addon: 'prod_T0nV8UXGTGhZop', // Naklikam.cz Content Basic (Addon)
  content_pro_addon: 'prod_T0nWGuGab66dsX', // Naklikam.cz Content Pro (Addon)
  content_business_addon: 'prod_T0nXsdTu1po1ng' // Naklikam.cz Content Business (Addon)
} as const

// Standalone Content Price IDs (plná cena)
export const CONTENT_STANDALONE_PRICE_IDS = {
  content_starter: 'price_1S4lrjLArwl6e4M5La8iWDSj', // 199 CZK/month - 100 credits
  content_pro: 'price_1S4lsZLArwl6e4M5BNvNzEkW', // 499 CZK/month - 300 credits
  content_business: 'price_1S4ltFLArwl6e4M5xu17MKv8' // 999 CZK/month - 1000 credits
} as const

// Addon Content Price IDs (20% sleva)
export const CONTENT_ADDON_PRICE_IDS = {
  content_basic: 'price_1S4lu3LArwl6e4M5jZO0BUr5', // 159 CZK/month - 100 credits
  content_pro: 'price_1S4lvbLArwl6e4M5p8vOlX7i', // 399 CZK/month - 300 credits
  content_business: 'price_1S4lwCLArwl6e4M5IA0MBFR6' // 799 CZK/month - 1000 credits
} as const

// Content plan details for UI
export const CONTENT_PLANS = {
  starter: {
    name: 'Content Starter',
    price: 199,
    addonPrice: 159,
    credits: 100,
    features: [
      '100 kreditů měsíčně',
      'AI generování textů',
      'SEO optimalizace',
      'Základní šablony'
    ]
  },
  pro: {
    name: 'Content Pro',
    price: 499,
    addonPrice: 399,
    credits: 300,
    features: [
      '300 kreditů měsíčně',
      'AI generování textů',
      'Pokročilé SEO nástroje',
      'Všechny šablony',
      'Prioritní podpora'
    ]
  },
  business: {
    name: 'Content Business',
    price: 999,
    addonPrice: 799,
    credits: 1000,
    features: [
      '1000 kreditů měsíčně',
      'AI generování textů',
      'Kompletní SEO suite',
      'Vlastní šablony',
      'Dedikovaný account manager'
    ]
  }
} as const

// Helper function to get the correct price ID
export function getContentPriceId(plan: keyof typeof CONTENT_PLANS, isAddon: boolean = false): string {
  const planKey = plan === 'starter' ? 'content_starter' : 
                   plan === 'pro' ? 'content_pro' : 'content_business'
  
  if (isAddon) {
    const addonKey = plan === 'starter' ? 'content_basic' :
                     plan === 'pro' ? 'content_pro' : 'content_business'
    return CONTENT_ADDON_PRICE_IDS[addonKey as keyof typeof CONTENT_ADDON_PRICE_IDS]
  }
  
  return CONTENT_STANDALONE_PRICE_IDS[planKey as keyof typeof CONTENT_STANDALONE_PRICE_IDS]
}

// Type exports
export type ContentPlanType = keyof typeof CONTENT_PLANS
export type WebPlanType = keyof typeof NEW_PRICE_IDS | keyof typeof LEGACY_PRICE_IDS