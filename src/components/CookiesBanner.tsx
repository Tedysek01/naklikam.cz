import { useState, useEffect } from 'react'
import { X, Settings, Cookie, Shield, BarChart3, Target, Wrench } from 'lucide-react'
import { Button } from './ui/Button'
import { useCookiesStore } from '@/store/cookiesStore'
import { Checkbox } from './ui/Checkbox'

export default function CookiesBanner() {
  const {
    preferences,
    showBanner,
    hasInteracted,
    setPreferences,
    acceptAll,
    rejectAll,
    hideBanner,
  } = useCookiesStore()

  const [showSettings, setShowSettings] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  console.log('[CookiesBanner] State:', { showBanner, hasInteracted, preferences })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Inicializace tracking při načtení stránky, pokud už má uživatel nastavené preference
    if (hasInteracted) {
      useCookiesStore.getState().initializeTracking()
    }
  }, [hasInteracted])

  const handlePreferenceChange = (category: keyof typeof preferences, value: boolean) => {
    if (category === 'necessary') return // Necessary cookies nelze vypnout
    setPreferences({ [category]: value })
  }

  const handleSaveSettings = () => {
    setShowSettings(false)
    hideBanner()
  }

  if (!showBanner || hasInteracted) return null

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Nezbytné cookies',
      description: 'Tyto cookies jsou nutné pro základní fungování webu a nelze je vypnout.',
      icon: Shield,
      required: true,
    },
    {
      key: 'functional' as const,
      title: 'Funkční cookies',
      description: 'Ukládání vašich preferencí a nastavení pro lepší uživatelský zážitek.',
      icon: Wrench,
      required: false,
    },
    {
      key: 'analytics' as const,
      title: 'Analytické cookies',
      description: 'Google Analytics pro analýzu návštěvnosti a zlepšování našich služeb.',
      icon: BarChart3,
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketingové cookies',
      description: 'Meta Pixel, TikTok Pixel a Google Ads pro cílenou reklamu a měření konverzí.',
      icon: Target,
      required: false,
    },
  ]

  // Mobile fullscreen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
        <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl max-h-[90vh] overflow-y-auto">
          {!showSettings ? (
            // Mobile Simple Banner
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-naklikam-pink-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Používáme cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Náš web používá cookies pro zajištění základní funkčnosti, analýzu návštěvnosti a zlepšování našich služeb. 
                    Některé cookies vyžadují váš souhlas.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={acceptAll}
                  className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
                >
                  Přijmout vše
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={rejectAll}
                    variant="outline"
                    className="flex-1"
                  >
                    Pouze nezbytné
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Nastavit
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <a 
                  href="/privacy" 
                  className="text-xs text-naklikam-pink-500 hover:underline"
                >
                  Zásady ochrany osobních údajů
                </a>
              </div>
            </div>
          ) : (
            // Mobile Settings
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Nastavení cookies
                </h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                {cookieCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <div key={category.key} className="border dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-naklikam-pink-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {category.title}
                            </h4>
                            <Checkbox
                              checked={preferences[category.key]}
                              onCheckedChange={(checked) => 
                                handlePreferenceChange(category.key, checked)
                              }
                              disabled={category.required}
                            />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSaveSettings}
                  className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
                >
                  Uložit nastavení
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      rejectAll()
                      setShowSettings(false)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Pouze nezbytné
                  </Button>
                  <Button
                    onClick={() => {
                      acceptAll()
                      setShowSettings(false)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Přijmout vše
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop bottom banner
  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg">
        {!showSettings ? (
          // Desktop Simple Banner
          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Cookie className="w-5 h-5 text-naklikam-pink-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Používáme cookies
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Pro zajištění funkčnosti, analýzu a zlepšování služeb. 
                  <a href="/privacy" className="text-naklikam-pink-500 hover:underline ml-1">
                    Více informací
                  </a>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={acceptAll}
                  size="sm"
                  className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
                >
                  Přijmout vše
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Nastavit
                </Button>
              </div>
              <Button
                onClick={rejectAll}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Pouze nezbytné
              </Button>
            </div>
          </div>
        ) : (
          // Desktop Settings
          <div className="p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Nastavení cookies
              </h3>
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-3 mb-4">
              {cookieCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <div key={category.key} className="border dark:border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-naklikam-pink-500" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {category.title}
                        </span>
                      </div>
                      <Checkbox
                        checked={preferences[category.key]}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange(category.key, checked)
                        }
                        disabled={category.required}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 pl-6">
                      {category.description}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleSaveSettings}
                size="sm"
                className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
              >
                Uložit nastavení
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    rejectAll()
                    setShowSettings(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Pouze nezbytné
                </Button>
                <Button
                  onClick={() => {
                    acceptAll()
                    setShowSettings(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Přijmout vše
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}