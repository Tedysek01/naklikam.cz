import { useNavigate } from 'react-router-dom'
import Logo from '@/components/ui/logo'
import { useEffect } from 'react'
import { trackViewContent } from '@/utils/analytics'
import { SocialMediaIcons } from '@/components/SocialMediaIcons'

import Pricing from '@/components/Pricing'

export default function PricingPage() {
  const navigate = useNavigate()
  
  useEffect(() => {
    trackViewContent('Pricing Page', 'pricing')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Zpět na hlavní stránku"
          >
            <Logo size="md" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Pricing />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-4">
              Máte otázky k ceníku? Kontaktujte nás na{' '}
              <a href="mailto:tadeas@raska.eu" className="text-naklikam-pink-500 hover:underline">
                tadeas@raska.eu
              </a>
            </p>
            <SocialMediaIcons className="justify-center mb-4" />
            <p>© 2024 Naklikam.cz - Vytvořte web pomocí AI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}