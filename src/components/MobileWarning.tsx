import { useState, useEffect } from 'react'
import { Monitor, X } from 'lucide-react'

export function MobileWarning() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('mobile-warning-dismissed')
    if (dismissed) {
      setHasBeenDismissed(true)
      return
    }

    // Check if mobile device
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile && !hasBeenDismissed) {
        setIsVisible(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [hasBeenDismissed])

  const handleDismiss = () => {
    localStorage.setItem('mobile-warning-dismissed', 'true')
    setIsVisible(false)
    setHasBeenDismissed(true)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white p-3 sm:p-4">
      <div className="container mx-auto px-3 sm:px-4 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
          <Monitor className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-semibold">
              Naklikam.cz funguje nejlépe na počítači
            </p>
            <p className="text-xs text-white/90 mt-0.5">
              Editor vyžaduje výkon desktopu a větší obrazovku pro plnohodnotnou práci s AI
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white p-1 -mt-1 sm:mt-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function MobileWarningModal() {
  // Removed - we'll just use the simple header warning
  return null
}