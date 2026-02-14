import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

import { AlertTriangle, Zap, X } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason: 'no_subscription' | 'token_limit' | 'inactive_subscription'
  currentPlan?: string
  tokensUsed?: number
  tokensLimit?: number
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  reason, 
  currentPlan,
  tokensUsed,
  tokensLimit 
}: UpgradeModalProps) {
  const navigate = useNavigate()
  const [isNavigating, setIsNavigating] = useState(false)
  
  if (!isOpen) return null
  
  const handleUpgrade = () => {
    setIsNavigating(true)
    navigate('/pricing')
    onClose()
  }
  
  const getModalContent = () => {
    switch (reason) {
      case 'no_subscription':
        return {
          title: 'Aktivujte si předplatné',
          message: 'Pro používání AI funkcí potřebujete aktivní předplatné. Vyberte si plán, který vám nejlépe vyhovuje.',
          icon: <Zap className="h-12 w-12 text-orange-500" />,
          buttonText: 'Vybrat plán',
          buttonColor: 'bg-orange-600 hover:bg-orange-700'
        }
      
      case 'token_limit':
        return {
          title: 'Dosáhli jste limitu tokenů',
          message: `Využili jste ${tokensUsed?.toLocaleString('cs-CZ')} z ${tokensLimit?.toLocaleString('cs-CZ')} tokenů vašeho ${currentPlan} plánu. Pro pokračování si prosím upgradujte váš plán.`,
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          buttonText: 'Upgradovat plán',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      
      case 'inactive_subscription':
        return {
          title: 'Neaktivní předplatné',
          message: 'Vaše předplatné není aktivní. Zkontrolujte prosím stav platby nebo obnovte své předplatné.',
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          buttonText: 'Spravovat předplatné',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      
      default:
        return {
          title: 'Problém s předplatným',
          message: 'Došlo k problému s vaším předplatným. Zkontrolujte prosím nastavení.',
          icon: <AlertTriangle className="h-12 w-12 text-gray-500" />,
          buttonText: 'Zkontrolovat',
          buttonColor: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }
  
  const content = getModalContent()
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card border-border relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          
          <h2 className="text-xl font-bold font-display text-foreground mb-3">
            {content.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {content.message}
          </p>
          
          {reason === 'token_limit' && tokensUsed && tokensLimit && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center text-sm mb-2">
                <span>Využití tokenů</span>
                <span className="font-medium">
                  {tokensUsed.toLocaleString('cs-CZ')} / {tokensLimit.toLocaleString('cs-CZ')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isNavigating}
            >
              Později
            </Button>
            <Button
              onClick={handleUpgrade}
              className={`flex-1 text-white ${content.buttonColor}`}
              disabled={isNavigating}
            >
              {isNavigating ? 'Přesměrovávám...' : content.buttonText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}