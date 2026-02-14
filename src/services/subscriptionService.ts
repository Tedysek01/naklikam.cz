import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export type SubscriptionPlan = 'free' | 'trial' | 'starter' | 'professional' | 'pro' | 'business' | 'unlimited' | 'enterprise'

// Datum spuštění nového ceníku - zákazníci před tímto datem mají legacy ceny
export const NEW_PRICING_DATE = '2024-12-01T00:00:00.000Z' // Nastav podle toho kdy spustíš nové ceny

export interface ContentAddon {
  plan: 'content_basic' | 'content_pro' | 'content_business'
  credits: number
  stripeSubscriptionItemId?: string
  active: boolean
}

export interface Subscription {
  plan: SubscriptionPlan
  tokens: number
  tokensUsed: number
  tokensLimit: number
  credits: number // Credits for content generation (base plan + addon)
  contentAddon?: ContentAddon | null // Optional content addon
  expiresAt: string
  createdAt: string
  updatedAt: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  isLegacyPricing?: boolean // Flag pro rychlejší checking
}

// Token limits per plan
const PLAN_LIMITS = {
  free: 70000, // 70k tokens
  trial: 100000, // 100k tokens
  starter: 2000000, // 2M tokens (legacy)
  professional: 5000000, // 5M tokens (legacy)
  pro: 2000000, // 2M tokens (new)
  business: 5000000, // 5M+ tokens (updated)
  unlimited: Infinity,
  enterprise: Infinity // Custom enterprise plan
}

// Web plans DO NOT include any credits - credits are ONLY from content addons
// Credits come exclusively from content_basic, content_pro, or content_business addons

// Content addon credits (monthly)
const CONTENT_ADDON_CREDITS = {
  content_basic: 100,    // 159 Kč (addon price with 20% discount)
  content_pro: 300,      // 399 Kč
  content_business: 1000 // 799 Kč
}

// Content addon prices
export const CONTENT_ADDON_PRICES = {
  content_basic: 159,    // 20% discount from 199
  content_pro: 399,      // 20% discount from 499
  content_business: 799  // 20% discount from 999
} as const
// Legacy pricing pro stávající zákazníky
export const LEGACY_PRICES = {
  trial: 70,
  starter: 580,
  professional: 1290,
  business: 2290,
  unlimited: 4970
} as const

// Nové ceny pro nové zákazníky
export const NEW_PRICES = {
  trial: 79,
  pro: 649,
  business: 1390,
  unlimited: 4970,
  enterprise: 0 // Custom pricing
} as const

// Zjistí jestli je zákazník legacy (má nárok na staré ceny)
export const isLegacyCustomer = (createdAt: string): boolean => {
  return new Date(createdAt) < new Date(NEW_PRICING_DATE)
}

// Vrátí správnou cenu podle toho jestli je zákazník legacy nebo nový
export const getPlanPrice = (plan: SubscriptionPlan, createdAt?: string): number => {
  if (createdAt && isLegacyCustomer(createdAt)) {
    return LEGACY_PRICES[plan as keyof typeof LEGACY_PRICES] || 0
  }
  return NEW_PRICES[plan as keyof typeof NEW_PRICES] || 0
}

export const subscriptionService = {
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const docRef = doc(db, 'users', userId, 'subscription', 'current')
      const snapshot = await getDoc(docRef)
      
      if (!snapshot.exists()) {
        // No subscription exists - user needs to purchase
        return null
      }
      
      const data = snapshot.data()
      const createdAt = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      
      return {
        plan: data.plan,
        tokens: data.tokens || 0,
        tokensUsed: data.tokensUsed || 0,
        tokensLimit: data.tokensLimit,
        credits: this.calculateTotalCredits(data),
        contentAddon: data.contentAddon || undefined,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        isLegacyPricing: isLegacyCustomer(createdAt) // Automaticky nastaví legacy flag
      }
    } catch (error) {
      console.error('Error getting subscription:', error)
      return null
    }
  },

  async createFreeSubscription(userId: string): Promise<void> {
    const subscription = {
      plan: 'free',
      tokens: PLAN_LIMITS.free,
      tokensUsed: 0,
      tokensLimit: PLAN_LIMITS.free,
      credits: 0, // Web plans have NO credits
      contentAddon: null,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 1 year (effectively no expiration)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    await setDoc(doc(db, 'users', userId, 'subscription', 'current'), subscription)
  },

  async updateTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'subscription', 'current')
      await updateDoc(docRef, {
        tokensUsed,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating token usage:', error)
      throw error
    }
  },

  async hasEnoughTokens(userId: string, requiredTokens: number = 50000): Promise<boolean> {
    const subscription = await this.getSubscription(userId)
    if (!subscription) return false
    
    // Check if subscription is expired
    if (new Date(subscription.expiresAt) < new Date()) {
      return false
    }
    
    // Unlimited plan
    if (subscription.plan === 'unlimited') {
      return true
    }
    
    // Check remaining tokens
    const remainingTokens = subscription.tokens - subscription.tokensUsed
    return remainingTokens >= requiredTokens
  },

  async consumeTokens(userId: string, tokens: number): Promise<void> {
    const subscription = await this.getSubscription(userId)
    if (!subscription) throw new Error('No subscription found')
    
    const newTokensUsed = subscription.tokensUsed + tokens
    await this.updateTokenUsage(userId, newTokensUsed)
  },
  calculateTotalCredits(subscriptionData: any): number {
    // Credits come ONLY from content addons, NOT from web plans
    const addonCredits = subscriptionData.contentAddon?.active 
      ? CONTENT_ADDON_CREDITS[subscriptionData.contentAddon.plan as keyof typeof CONTENT_ADDON_CREDITS] || 0
      : 0
    return addonCredits
  },

  async addContentAddon(userId: string, addonPlan: 'content_basic' | 'content_pro' | 'content_business', stripeSubscriptionItemId?: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'subscription', 'current')
      const currentSubscription = await getDoc(docRef)
      
      if (!currentSubscription.exists()) {
        throw new Error('No base subscription found')
      }
      
      const contentAddon: ContentAddon = {
        plan: addonPlan,
        credits: CONTENT_ADDON_CREDITS[addonPlan],
        stripeSubscriptionItemId,
        active: true
      }
      
      await updateDoc(docRef, {
        contentAddon,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error adding content addon:', error)
      throw error
    }
  },

  async removeContentAddon(userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'subscription', 'current')
      await updateDoc(docRef, {
        contentAddon: null,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error removing content addon:', error)
      throw error
    }
  },


  async upgradeSubscription(userId: string, plan: SubscriptionPlan): Promise<void> {
    const subscription = {
      plan,
      tokens: PLAN_LIMITS[plan],
      tokensUsed: 0,
      tokensLimit: PLAN_LIMITS[plan],
      credits: 0, // Web plans have NO credits
      contentAddon: null,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    await setDoc(doc(db, 'users', userId, 'subscription', 'current'), subscription)
  }
}