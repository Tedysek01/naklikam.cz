import { useState, useEffect } from 'react'
import { X, Coffee, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

interface TrialExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  onProceedToTrial: () => void
}

export function TrialExplanationModal({ isOpen, onClose, onProceedToTrial }: TrialExplanationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-500/50 max-w-lg w-full relative border border-purple-400/30 backdrop-blur-xl">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-6 sm:p-8 text-white relative rounded-t-2xl sm:rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="text-2xl">💬</span>
            </div>
            <h2 className="text-2xl font-bold">Malá změna</h2>
          </div>
        </div>

          <div className="p-6 sm:p-8 space-y-4 sm:space-y-6">
          <p className="text-gray-200 leading-relaxed text-base">
            Původně jsem chtěl dát první použití zdarma.
          </p>
          
          <p className="text-gray-200 leading-relaxed text-base">
            Jenže po <strong className="text-white">návalu uživatelů</strong> to začalo žrát tisíce korun měsíčně jen na provozu AI – a to už jako student neutáhnu.
          </p>

          <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border border-purple-400/50 rounded-2xl p-6 backdrop-blur-sm shadow-inner">
            <p className="text-purple-100 leading-relaxed text-base">
              Proto je tu <strong className="text-white text-lg">testovací balíček za 79 Kč</strong>, aby se pokryly náklady a ty sis to pořád mohl vyzkoušet.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-500/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 border border-purple-400/40">
                🎯
              </div>
              <p className="text-gray-200 text-base leading-relaxed">
                <strong className="text-white">Stačí to na 2–3 AI generování</strong> - uvidíš, jak to funguje, a sám se rozhodneš, jestli pokračovat.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <Coffee className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <p className="text-gray-200 text-base leading-relaxed">
                <strong className="text-white">Když tě to nechytne</strong>, přijdeš o cenu jednoho piva.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <p className="text-gray-200 text-base leading-relaxed">
                <strong className="text-white">Když ano</strong>, postavíš si web nebo appku za pár minut.
              </p>
            </div>
          </div>
        </div>

          <div className="p-6 sm:p-8 pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={onProceedToTrial}
              className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-700 hover:via-violet-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/40 py-3 rounded-xl font-semibold"
            >
              <span className="whitespace-nowrap">Vybrat Trial</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-purple-400/50 text-gray-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-300 py-3 rounded-xl"
            >
              <span className="whitespace-nowrap">Možná později</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook pro správu zobrazení modalu
export function useTrialExplanationModal() {
  const { user } = useAuthStore()
  const [shouldShow, setShouldShow] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    // Zkontroluj jestli už má aktivní předplatné
    if (user.subscription && user.subscription.plan !== 'free') {
      setShouldShow(false)
      return
    }

    // Zkontroluj jestli už modal viděl (localStorage)
    const hasSeenModal = localStorage.getItem(`trial-explanation-seen-${user.id}`)
    if (hasSeenModal) {
      setShouldShow(false)
      return
    }

    // Zobraz všem co nemají předplatné (odstraněno omezení na nové uživatele)
    setShouldShow(true)
    // Automaticky zobraz modal po krátkém zpoždění
    setTimeout(() => setIsOpen(true), 1500)
  }, [user])

  const closeModal = () => {
    if (user) {
      localStorage.setItem(`trial-explanation-seen-${user.id}`, 'true')
    }
    setIsOpen(false)
    setShouldShow(false)
  }

  const proceedToTrial = () => {
    closeModal()
    // Přesměruj na pricing page
    window.location.href = '/subscription'
  }

  return {
    isOpen: shouldShow && isOpen,
    closeModal,
    proceedToTrial
  }
}