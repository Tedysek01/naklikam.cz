import { useState } from 'react'
import { Settings, Cookie, Shield, BarChart3, Target, Wrench } from 'lucide-react'
import { Button } from './ui/Button'
import { Checkbox } from './ui/Checkbox'
import { useCookiesStore } from '@/store/cookiesStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export default function CookiesSettings() {
  const { preferences, setPreferences } = useCookiesStore()
  const [isOpen, setIsOpen] = useState(false)

  const handlePreferenceChange = (category: keyof typeof preferences, value: boolean) => {
    if (category === 'necessary') return // Necessary cookies nelze vypnout
    setPreferences({ [category]: value })
  }

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Nezbytné cookies',
      description: 'Tyto cookies jsou nutné pro základní fungování webu a nelze je vypnout. Zahrnují autentizaci, bezpečnost a základní funkčnost.',
      icon: Shield,
      required: true,
      examples: 'Přihlášení, zabezpečení, jazykové preference',
    },
    {
      key: 'functional' as const,
      title: 'Funkční cookies',
      description: 'Ukládání vašich preferencí a nastavení pro lepší uživatelský zážitek.',
      icon: Wrench,
      required: false,
      examples: 'Tmavý/světlý režim, velikost písma, rozložení stránky',
    },
    {
      key: 'analytics' as const,
      title: 'Analytické cookies',
      description: 'Pomáhají nám pochopit, jak návštěvníci používají náš web, abychom ho mohli vylepšovat.',
      icon: BarChart3,
      required: false,
      examples: 'Google Analytics, počet návštěv, nejoblíbenější stránky',
    },
    {
      key: 'marketing' as const,
      title: 'Marketingové cookies',
      description: 'Používají se pro cílenou reklamu a měření účinnosti reklamních kampaní.',
      icon: Target,
      required: false,
      examples: 'Meta Pixel, TikTok Pixel, Google Ads, retargeting',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Nastavení cookies
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-naklikam-pink-500" />
            Nastavení cookies
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            <p>
              Cookies nám pomáhají poskytovat lepší služby. Můžete si vybrat, které kategorie cookies chcete povolit.
              Nezbytné cookies jsou vždy aktivní, protože bez nich by web nefungoval.
            </p>
          </div>

          <div className="space-y-4">
            {cookieCategories.map((category) => {
              const IconComponent = category.icon
              return (
                <div 
                  key={category.key} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-naklikam-pink-500" />
                      <div>
                        <h3 className="font-medium text-foreground">
                          {category.title}
                        </h3>
                        {category.required && (
                          <span className="text-xs text-muted-foreground">
                            (Vždy aktivní)
                          </span>
                        )}
                      </div>
                    </div>
                    <Checkbox
                      checked={preferences[category.key]}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(category.key, checked)
                      }
                      disabled={category.required}
                    />
                  </div>
                  
                  <div className="pl-8 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Příklady:</strong> {category.examples}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                useCookiesStore.getState().acceptAll()
                setIsOpen(false)
              }}
              className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white"
            >
              Přijmout vše
            </Button>
            <Button
              onClick={() => {
                useCookiesStore.getState().rejectAll()
                setIsOpen(false)
              }}
              variant="outline"
            >
              Pouze nezbytné
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="ml-auto"
            >
              Uložit nastavení
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>
              Více informací o zpracování osobních údajů najdete v našich{' '}
              <a href="/privacy" className="text-naklikam-pink-500 hover:underline">
                Zásadách ochrany osobních údajů
              </a>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}