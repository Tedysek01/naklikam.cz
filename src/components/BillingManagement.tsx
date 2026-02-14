import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { CreditCard, Loader2 } from 'lucide-react'

export function BillingManagement() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  if (!user?.subscription) return null
  
  const handleManageBilling = async () => {
    // Require stripeCustomerId to be present
    if (!user.subscription?.stripeCustomerId) {
      alert('Nemáte propojený účet se Stripe. Kontaktujte prosím podporu.')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId: user.subscription.stripeCustomerId,
          userId: user.id // Send userId for verification
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Portal session error:', errorData)
        
        if (response.status === 404) {
          alert('Nebyl nalezen účet ve Stripe. Kontaktujte prosím podporu na tadeas@raska.eu')
        } else if (response.status === 403) {
          alert('Nemáte oprávnění k přístupu k tomuto účtu.')
        } else {
          alert(errorData.message || 'Nepodařilo se otevřít správu předplatného. Zkuste to prosím znovu.')
        }
        return
      }
      
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Nepodařilo se připojit ke Stripe. Zkuste to prosím znovu.')
    } finally {
      setIsLoading(false)
    }
  }

  
  return (
    <div className="rounded-lg border bg-card border-border shadow-lg p-6">
      <h3 className="text-lg font-semibold text-naklikam-pink-300 mb-2 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-naklikam-pink-400" />
        Správa předplatného
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Spravujte své předplatné, platební metody a faktury přímo ve Stripe Customer Portal.
      </p>
      <Button 
        onClick={handleManageBilling}
        disabled={isLoading}
        className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Načítání...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Spravovat předplatné
          </>
        )}
      </Button>
    </div>
  )
}