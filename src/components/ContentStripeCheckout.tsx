import { loadStripe } from '@stripe/stripe-js'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { trackInitiateCheckout } from '@/utils/analytics'
import { getContentPriceId, CONTENT_PLANS, type ContentPlanType } from '@/config/stripe.config'
import { Loader2 } from 'lucide-react'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', disabled = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-naklikam-pink-500/50 bg-transparent text-naklikam-pink-400 hover:bg-naklikam-pink-500/10 hover:border-naklikam-pink-500' :
      variant === 'ghost' ? 'text-naklikam-pink-300 hover:bg-naklikam-pink-500/10' :
      'bg-naklikam-gradient text-white hover:bg-naklikam-gradient-dark'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    onClick={onClick}
    disabled={disabled}
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

interface ContentStripeCheckoutProps {
  plan: ContentPlanType
  isAddon?: boolean
  highlighted?: boolean
  className?: string
  children?: React.ReactNode
}

export function ContentStripeCheckout({ 
  plan, 
  isAddon = false, 
  highlighted = false, 
  className = '', 
  children 
}: ContentStripeCheckoutProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to auth page
      window.location.href = '/auth?redirect=/content-marketing'
      return
    }

    // Check if addon requires base plan
    if (isAddon && (!user.subscription || user.subscription.plan === 'trial')) {
      alert('Pro přidání rozšíření pro obsah potřebujete nejdříve aktivní web plán.')
      window.location.href = '/pricing'
      return
    }

    setLoading(true)
    
    // Track checkout initiation
    const planDetails = CONTENT_PLANS[plan]
    const price = isAddon ? planDetails.addonPrice : planDetails.price
    trackInitiateCheckout(price, 1, `content_${plan}${isAddon ? '_addon' : ''}`)
    
    try {
      // Get the correct price ID based on plan and addon status
      const priceId = getContentPriceId(plan, isAddon)
      
      const response = await fetch('/api/stripe/create-content-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          customerEmail: user.email,
          isAddon,
          planType: plan,
          // If addon, include existing subscription ID
          existingSubscriptionId: isAddon ? user.subscription?.stripeSubscriptionId : undefined
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create checkout session')
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
      alert(error instanceof Error ? error.message : 'Nepodařilo se načíst platební bránu.')
    } finally {
      setLoading(false)
    }
  }

  // If user already has this addon, show different message
  const hasAddon = user?.subscription?.contentAddon?.plan === `content_${plan}`
  
  if (hasAddon && isAddon) {
    return (
      <Button
        disabled
        variant="outline"
        className={`w-full opacity-50 ${className}`}
      >
        Již aktivní
      </Button>
    )
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
        children || (isAddon ? 'Přidat rozšíření' : 'Vybrat plán')
      )}
    </Button>
  )
}