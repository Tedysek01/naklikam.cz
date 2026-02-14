import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/ui/logo'
import { Button } from '@/components/ui/Button'
import { useEffect } from 'react'
import { trackViewContent } from '@/utils/analytics'
import { SocialMediaIcons } from '@/components/SocialMediaIcons'
import CompletePricing from '@/components/CompletePricing'

export default function CompletePricingPage() {
  const navigate = useNavigate()
  
  useEffect(() => {
    trackViewContent('Complete Pricing Page', 'complete-pricing')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo size="md" />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět na hlavní stránku
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <CompletePricing />
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