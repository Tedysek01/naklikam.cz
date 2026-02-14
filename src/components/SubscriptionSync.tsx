import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'

export function SubscriptionSync() {
  const { user } = useAuthStore()
  const [isSyncing, setIsSyncing] = useState(false)
  
  if (!user) return null
  
  // Show sync card if user doesn't have subscription (might need sync after payment)
  if (user.subscription) return null

  const handleSyncSubscription = async () => {
    if (!user) return
    
    setIsSyncing(true)
    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync subscription')
      }
      
      const result = await response.json()
      
      // Show stripeCustomerId warning if missing
      if (result.subscription && !result.subscription.stripeCustomerId) {
        alert(`Předplatné synchronizováno, ale chybí Stripe ID. Kontaktujte prosím podporu.`)
      } else {
        alert(`Předplatné synchronizováno! Plán: ${result.subscription?.plan}`)
      }
      
      // Refresh page to show updated subscription
      window.location.reload()
    } catch (error: any) {
      console.error('Error syncing subscription:', error)
      if (error?.message?.includes('No Stripe customer found')) {
        alert('Nebyl nalezen žádný Stripe zákazník. Ujistěte se, že jste dokončili platbu.')
      } else {
        alert('Nepodařilo se synchronizovat předplatné. Zkuste to prosím znovu.')
      }
    } finally {
      setIsSyncing(false)
    }
  }
  
  return (
    <Card className="p-6 bg-card border border-pink-200/50 dark:border-pink-800/50 shadow-lg">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-pink-700 dark:text-pink-300">
            Právě jste zaplatili?
          </h3>
          <p className="text-sm text-pink-600 dark:text-pink-400 mt-1 mb-3">
            Pokud jste právě dokončili platbu, ale nevidíte své předplatné, klikněte na synchronizaci.
          </p>
          <Button 
            onClick={handleSyncSubscription}
            disabled={isSyncing}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-md"
            size="sm"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Synchronizuji...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Synchronizovat předplatné
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}