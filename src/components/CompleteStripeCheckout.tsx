import { loadStripe } from '@stripe/stripe-js'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { trackInitiateCheckout } from '@/utils/analytics'
import { Loader2 } from 'lucide-react'
import { getPlanPrice, isLegacyCustomer } from '@/services/subscriptionService'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-naklikam-pink-500/50 bg-transparent text-naklikam-pink-400 hover:bg-naklikam-pink-500/10 hover:border-naklikam-pink-500' :
      variant === 'ghost' ? 'text-naklikam-pink-300 hover:bg-naklikam-pink-500/10' :
      'bg-naklikam-gradient text-white hover:bg-naklikam-gradient-dark'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
if (!stripeKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set!')
}
// Try to load Stripe with error handling
let stripePromise: ReturnType<typeof loadStripe> | null = null
if (stripeKey) {
  try {
    stripePromise = loadStripe(stripeKey)
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    stripePromise = null
  }
}

// Legacy Price IDs pro stávající zákazníky
const LEGACY_PRICE_IDS = {
  trial: 'price_1Ru0FwLArwl6e4M5oUZrb65n', // Trial plan - 70 CZK/month (legacy)
  starter: 'price_1RqZh9LArwl6e4M5oVw9Vyz3', // Starter - 580 CZK
  professional: 'price_1RqZhZLArwl6e4M5mbLPPcfK', // Professional - 1290 CZK
  business: 'price_1RqZj6LArwl6e4M5qLGicRkl', // Business - 2290 CZK (legacy)
  unlimited: 'price_1RqZn2LArwl6e4M5BOAkMe0H' // Unlimited - 4970 CZK
} as const

// Nové Price IDs pro nové zákazníky
const NEW_PRICE_IDS = {
  trial: 'price_1S3kamLArwl6e4M5RfxxVdzw', // Trial plan - 79 CZK/month
  pro: 'price_1S3kfdLArwl6e4M5gKLnSwQN', // Pro plan - 649 CZK/month
  business: 'price_1S3kgILArwl6e4M5flCloWyy', // Business plan - 1390 CZK/month
  unlimited: 'price_1RqZn2LArwl6e4M5BOAkMe0H' // Unlimited - 4970 CZK/month (same)
} as const

// Annual Price IDs pro roční předplatné
const ANNUAL_PRICE_IDS = {
  trial: null, // Trial nemá annual variantu
  pro: 'price_1S3ki9LArwl6e4M5PgZcb4oD', // 6,490 CZK/rok
  business: 'price_1S3kiqLArwl6e4M5NeUWJaKZ', // 13,900 CZK/rok 
  unlimited: 'price_1S3kjoLArwl6e4M5B6UO9FHz' // 49,700 CZK/rok
} as const

// Vybere správné Price ID podle toho jestli je zákazník legacy a jestli chce annual
const getPriceId = (plan: string, userCreatedAt?: string, isAnnual: boolean = false): string => {
  // Annual billing je jen pro nové zákazníky a ne pro trial
  if (isAnnual && plan !== 'trial') {
    return ANNUAL_PRICE_IDS[plan as keyof typeof ANNUAL_PRICE_IDS] || ''
  }
  
  const isLegacy = userCreatedAt && isLegacyCustomer(userCreatedAt)
  
  if (isLegacy && plan in LEGACY_PRICE_IDS) {
    return LEGACY_PRICE_IDS[plan as keyof typeof LEGACY_PRICE_IDS]
  }
  
  return NEW_PRICE_IDS[plan as keyof typeof NEW_PRICE_IDS] || LEGACY_PRICE_IDS[plan as keyof typeof LEGACY_PRICE_IDS] || ''
}

type PlanType = keyof typeof NEW_PRICE_IDS | keyof typeof LEGACY_PRICE_IDS

interface CompleteStripeCheckoutProps {
  plan: PlanType
  highlighted?: boolean
  isTrial?: boolean
  isAnnual?: boolean
  className?: string
  children?: React.ReactNode
}

export function CompleteStripeCheckout({ plan, highlighted = false, isAnnual = false, className = '', children }: CompleteStripeCheckoutProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to auth page
      window.location.href = '/auth?redirect=/complete-pricing'
      return
    }

    setLoading(true)
    
    // Track checkout initiation s správnou cenou
    const planPrice = user?.subscription?.createdAt 
      ? getPlanPrice(plan as any, user.subscription.createdAt)
      : getPlanPrice(plan as any)
    
    trackInitiateCheckout(planPrice, 1, plan)
    
    try {
      // Vybere správné Price ID podle zákazníka a billing typu
      const priceId = getPriceId(plan, user.subscription?.createdAt, isAnnual)
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          customerEmail: user.email
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }
      
      const { sessionId, url } = await response.json()
      
      // Always use the direct URL for redirect (avoid Stripe.js loading issues)
      if (url) {
        window.location.href = url
      } else if (sessionId && stripePromise) {
        // Fallback to Stripe.js redirect only if we have sessionId and Stripe loaded
        try {
          const stripe = await stripePromise
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId })
            if (error) {
              console.error('Stripe redirect error:', error)
              throw new Error('Failed to redirect to checkout')
            }
          } else {
            throw new Error('Stripe.js not available')
          }
        } catch (stripeError) {
          console.error('Stripe.js fallback failed:', stripeError)
          throw new Error('Cannot redirect to checkout - Stripe.js failed to load')
        }
      } else {
        throw new Error('No checkout URL or session ID received')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Nepodařilo se načíst platební bránu. Zkuste to prosím znovu.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading}
      variant={highlighted ? undefined : "outline"}
      className={`w-full ${
        highlighted
          ? 'bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white'
          : 'hover:bg-naklikam-gradient hover:text-white'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Načítání...
        </>
      ) : (
        children || 'Vybrat plán'
      )}
    </Button>
  )
}