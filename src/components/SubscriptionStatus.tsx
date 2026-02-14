import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

import { Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function SubscriptionStatus() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  if (!user) return null
  
  const subscription = user.subscription
  
  if (!subscription) {
    return (
      <Card className="p-6 bg-card !border-0 shadow-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-naklikam-pink-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-naklikam-pink-300">
              Aktivujte si předplatné
            </h3>
            <p className="text-sm text-naklikam-pink-400 mt-1">
              Pro používání AI funkcí je potřeba aktivní předplatné.
            </p>
            <Button 
              onClick={() => navigate('/pricing')}
              className="mt-3 bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white border-0 shadow-md"
              size="sm"
            >
              Vybrat plán
            </Button>
          </div>
        </div>
      </Card>
    )
  }
  
  // Calculate usage percentage
  const usagePercentage = subscription.tokensLimit === -1 
    ? 0 
    : Math.round((subscription.tokensUsed / subscription.tokensLimit) * 100)
    
  const tokensRemaining = subscription.tokensLimit === -1
    ? 'Neomezené'
    : (subscription.tokensLimit - subscription.tokensUsed).toLocaleString('cs-CZ')
    
  const isUnlimited = subscription.plan === 'unlimited'
  const isFreePlan = subscription.plan === 'free'
  const isNearLimit = !isUnlimited && usagePercentage >= 80
  
  // Format plan name
  const planName = isFreePlan ? 'Free' : subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
  
  return (
    <Card className="p-6 bg-card border border-border shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-naklikam-pink-300 flex items-center gap-2">
            <Zap className="h-5 w-5 text-naklikam-pink-500" />
            {planName} plán
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Platný do: {new Date(subscription.expiresAt).toLocaleDateString('cs-CZ')}
          </p>
        </div>
        {isUnlimited && (
          <div className="flex items-center gap-1 text-naklikam-pink-300">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Unlimited</span>
          </div>
        )}
      </div>
      
      {!isUnlimited && (
        <>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Využito tokenů</span>
              <span className="font-medium">
                {subscription.tokensUsed.toLocaleString('cs-CZ')} / {subscription.tokensLimit.toLocaleString('cs-CZ')}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isNearLimit 
                    ? 'bg-naklikam-pink-500' 
                    : 'bg-naklikam-gradient'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {isNearLimit && (
              <p className="text-sm text-naklikam-pink-400 flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4" />
                Blížíte se k limitu tokenů
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Zbývá tokenů: <span className="font-medium text-foreground">{tokensRemaining}</span>
          </div>
          
          {isFreePlan && (
            <div className="mt-3 p-3 bg-naklikam-pink-900/20 rounded-lg">
              <p className="text-sm text-naklikam-pink-300">
                ⚠️ Free plán neumožňuje zobrazení a stažení kódu
              </p>
            </div>
          )}
        </>
      )}
      
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/pricing')}
          className="border-naklikam-pink-500 text-naklikam-pink-300 hover:bg-naklikam-pink-900/20"
        >
          Změnit plán
        </Button>
      </div>
    </Card>
  )
}