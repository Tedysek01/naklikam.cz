import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, LogOut, Menu, X, ZoomIn } from 'lucide-react'
import Logo from '@/components/ui/logo'
import { trackViewContent } from '@/utils/analytics'
import { SocialMediaIcons } from '@/components/SocialMediaIcons'

// Import Button component
import { Button } from '@/components/ui/Button'


// import CommunityProjects from '@/components/CommunityProjects'
import HowItWorks from '@/components/HowItWorks'
import { HowToUse } from '@/components/HowToUse'
import FAQ from '@/components/FAQ'
import CTA from '@/components/CTA'
import LandingChatBox from '@/components/LandingChatBox'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const { user, isAuthenticated, logout, initAuth } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<'cukrarna' | 'social' | null>(null)

  useEffect(() => {
    initAuth()
    trackViewContent('Home Page', 'homepage')
  }, [initAuth])

  const handleLogout = async () => {
    await logout()
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] md:w-[120%] h-[600px] md:h-[800px] opacity-60">
          <div className="absolute inset-0 bg-gradient-to-b from-naklikam-purple-500/20 via-naklikam-pink-500/30 to-transparent blur-2xl md:blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-40">
          <div className="absolute inset-0 bg-gradient-radial from-naklikam-pink-500/40 to-transparent blur-2xl md:blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-40">
          <div className="absolute inset-0 bg-gradient-radial from-naklikam-purple-500/40 to-transparent blur-2xl md:blur-3xl"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
      <nav className="relative">
        <div className="flex items-center justify-between p-4 md:p-6">
          {/* Logo - Left */}
          <div className="flex items-center">
            <Logo size="lg" />
          </div>
          
          {/* Navigation Menu - Center (Desktop) */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#jak-to-funguje" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
              Jak to funguje
            </a>
            <Link to="/pricing" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
              Ceník
            </Link>
            <a href="#faq" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
              FAQ
            </a>
            <a href="/navody" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
              Návody
            </a>
            <a href="#kontakt" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
              Kontakt
            </a>
          </div>

          {/* Auth Buttons - Right (Desktop) */}
          <div className="hidden md:flex items-center space-x-2 md:space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-foreground">{user.name}</span>
                  {user.subscription && (
                    <span className="text-xs bg-naklikam-gradient text-white px-2 py-1 rounded-full">
                      {user.subscription.plan}
                    </span>
                  )}
                </div>
                <Link to="/dashboard">
                  <Button variant="outline" className="text-sm md:text-base px-3 md:px-4">
                    <User className="h-4 w-4 mr-1" />
                    Projekty
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  className="text-sm md:text-base px-2 md:px-3"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-sm md:text-base px-3 md:px-4">
                    Přihlásit se
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-sm md:text-base px-4 md:px-6">
                    Začít tvořit
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50">
            <div className="p-4 space-y-4">
              {/* Navigation Links */}
              <div className="space-y-3">
                <a 
                  href="#jak-to-funguje" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Jak to funguje
                </a>
                <Link 
                  to="/pricing" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Ceník
                </Link>
                <a 
                  href="#faq" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  FAQ
                </a>
                <a 
                  href="/navody" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Návody
                </a>
                <a 
                  href="#kontakt" 
                  className="block text-foreground/80 hover:text-foreground transition-colors py-2"
                  onClick={closeMobileMenu}
                >
                  Kontakt
                </a>
              </div>

              {/* Auth Section */}
              <div className="pt-4 border-t border-border">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 py-2">
                      <img 
                        src={user.avatar} 
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="text-foreground font-medium">{user.name}</div>
                        {user.subscription && (
                          <span className="text-xs bg-naklikam-gradient text-white px-2 py-1 rounded-full">
                            {user.subscription.plan}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to="/dashboard" onClick={closeMobileMenu}>
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Projekty
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => { handleLogout(); closeMobileMenu(); }} 
                      variant="ghost" 
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Odhlásit se
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link to="/auth" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="w-full">
                        Přihlásit se
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={closeMobileMenu}>
                      <Button className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white">
                        Začít tvořit
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <main className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-display text-foreground mb-4 sm:mb-6">
              <span className="block">Vytvořte si web nebo aplikaci</span>
              <span className="bg-naklikam-gradient bg-clip-text text-transparent"> jen chatováním s AI</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 px-2 sm:px-4 md:px-0 max-w-3xl mx-auto">
              Popište česky co potřebujete a AI vám vygeneruje kompletní funkční kód.
            </p>
            
            {/* Main CTA with better prompt */}
            <div className="mb-6">
              <LandingChatBox placeholder="třeba 'web pro kadeřnici s fotkami a ceníkem' nebo 'rezervační systém pro autoservis'..." />
            </div>
            
            {/* Strong CTA Button */}
            <div className="flex flex-col items-center justify-center gap-3 mb-12">
              <Button 
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-lg px-8 py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                Začít tvořit <span className="ml-2">→</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Web za 10 minut • Registrace za 30 sekund • Bez programování
              </span>
            </div>
        </div>
      </main>

      {/* Content Sections */}
      <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* Demo Websites Section - NEW */}
        <div className="py-16 sm:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground mb-3 sm:mb-4">
              Takové stránky si můžete vytvořit i vy
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Ukázky webů, které si můžete vytvořit za pár minut – bez programování, bez čekání
            </p>
          </div>
          
          {/* Demo cards grid */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Cukrárna demo */}
            <div 
              className="group bg-card/50 rounded-2xl p-6 border border-border hover:border-pink-500/50 transition-all cursor-pointer hover:shadow-xl"
              onClick={() => setSelectedDemo('cukrarna')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Cukrárna U Babičky</h3>
                  <p className="text-sm text-muted-foreground">Třebíč • Za 3 minuty</p>
                </div>
                <div className="flex items-center gap-2 text-pink-500">
                  <ZoomIn className="h-5 w-5" />
                  <span className="text-sm">Zobrazit</span>
                </div>
              </div>
              
              <div className="bg-background/80 rounded-lg p-4 mb-4 border border-pink-500/20">
                <p className="text-foreground italic text-sm">
                  "Potřebuju web pro moji cukrárnu. Chci tam fotky dortů, ceník, kontaktní formulář pro objednávky a otevírací dobu."
                </p>
              </div>
              
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src="/cukrarna_hero.webp" 
                  alt="Preview cukrárny"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Plně funkční
                </div>
              </div>
            </div>
            
            {/* Social Media demo */}
            <div 
              className="group bg-card/50 rounded-2xl p-6 border border-border hover:border-purple-500/50 transition-all cursor-pointer hover:shadow-xl"
              onClick={() => setSelectedDemo('social')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Socials Brno</h3>
                  <p className="text-sm text-muted-foreground">Brno • Za 5 minut</p>
                </div>
                <div className="flex items-center gap-2 text-purple-500">
                  <ZoomIn className="h-5 w-5" />
                  <span className="text-sm">Zobrazit</span>
                </div>
              </div>
              
              <div className="bg-background/80 rounded-lg p-4 mb-4 border border-purple-500/20">
                <p className="text-foreground italic text-sm">
                  "Chci web pro social media agenturu s portfoliem, cenami služeb a kontaktním formulářem."
                </p>
              </div>
              
              <div className="relative overflow-hidden rounded-lg">
                <img 
                  src="/social_hero.webp" 
                  alt="Preview social media agentury"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-3 left-3 bg-violet-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ✓ Profesionální
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              onClick={() => document.querySelector('textarea')?.focus()}
              className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-lg px-8 py-4"
            >
              Začít tvořit →
            </Button>
          </div>
        </div>
      </div>

      {/* Pro koho je Naklikam.cz - MOVED UP */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground mb-3 sm:mb-4">
              Kdo si u nás vytváří weby a aplikace?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Každý, kdo potřebuje být online, ale nechce se učit programovat
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔧</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Řemeslníci & Služby</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Kadeřnice, autoservisy, truhlářství, maséři, čistírny...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🏪</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Malé firmy</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Začínající podniky, staré weby k obnově, nové produkty...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💼</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Konzultanti & Koučové</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Osobní brand, portfolio, rezervační systémy, kurzy...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚽</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Spolky & Komunity</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Sportovní kluby, zájmové skupiny, neziskovky, akce...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🛠️</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Interní nástroje</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                CRM systémy, evidence, dashboardy, intranet...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📱</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Mobilní aplikace</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Webové aplikace, PWA, responzivní řešení...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🛍️</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">E-commerce</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Online obchody, marketplace, rezervace, platby...
              </p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🎓</div>
              <h3 className="text-base sm:text-lg font-semibold font-display mb-2 sm:mb-3 text-foreground">Vzdělávání</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Online kurzy, e-learning, testy, certifikace...
              </p>
            </div>
          </div>
          
          {/* CTA after 'pro koho' section */}
          <div className="text-center">
            <Button 
              onClick={() => document.querySelector('textarea')?.focus()}
              className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-lg px-8 py-4"
            >
              Začít tvořit →
            </Button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {/* How It Works */}
        <div id="jak-to-funguje">
          <HowItWorks />
        </div>
        
        {/* How To Use Video */}
        <HowToUse videoId="gmfjw2yeb1o" />
        
        {/* CTA after How It Works */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => document.querySelector('textarea')?.focus()}
            className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-lg px-8 py-4"
          >
            Začít tvořit →
          </Button>
        </div>

        {/* Community Projects */}
        {/* <CommunityProjects /> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16 lg:mt-20">
          <div className="text-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:border-naklikam-pink-600/50 transition-colors">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🗣️</div>
            <h3 className="text-lg sm:text-xl font-semibold font-display mb-2 text-foreground">Mluvíte česky</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Řeknete AI česky co chcete. Žádné technické termíny, jen normální řeč.
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:border-naklikam-purple-600/50 transition-colors">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold font-display mb-2 text-foreground">Hotovo za oběd</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Web za 10 minut místo měsíců čekání. Vidíte výsledek okamžitě.
            </p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-card rounded-xl border border-border hover:border-naklikam-pink-600/50 transition-colors sm:col-span-2 md:col-span-1">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🤝</div>
            <h3 className="text-lg sm:text-xl font-semibold font-display mb-2 text-foreground">Rychlá podpora</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Email podpora v češtině do 24 hodin. Skuteční lidé, ne chatboti.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-20">
          <FAQ />
        </div>

        {/* CTA */}
        <CTA />
        
        {/* Čeho se nemusíte bát */}
        <div className="mt-16 sm:mt-20 bg-card/20 rounded-2xl p-6 sm:p-8 lg:p-12">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3 sm:mb-4">
              Nerozumíte počítačům? V pořádku!
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              O technické věci se postaráme
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <div className="text-2xl text-green-500">✓</div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Mluvíte česky</h3>
                <p className="text-muted-foreground text-sm">
                  Popište co chcete normální řečí. AI vám to naprogramuje.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-2xl text-green-500">✓</div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Automatické nasazení</h3>
                <p className="text-muted-foreground text-sm">
                  Jedním klikem je váš web online a dostupný celému světu.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-2xl text-green-500">✓</div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Bez obav z chyb</h3>
                <p className="text-muted-foreground text-sm">
                  Vše se verzuje. Můžete se vrátit k předchozí verzi kdykoliv.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-2xl text-green-500">✓</div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Česká podpora</h3>
                <p className="text-muted-foreground text-sm">
                  Když si nebudete vědět rady, pomozíme v češtině.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        
      </div>

      {/* Footer */}
      <footer id="kontakt" className="bg-card/50 backdrop-blur-sm border-t border-border mt-16 md:mt-32">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
            {/* Logo and description */}
            <div className="col-span-1 sm:col-span-2 mb-6 sm:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="md" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Vytvářejte aplikace a weby pomocí AI,<br />
                aniž byste psali kód.
              </p>
              
              {/* Social Media Icons */}
              <SocialMediaIcons />
            </div>
            
            {/* Company */}
            <div>
              <h3 className="font-semibold font-display mb-4">Firma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contact" className="hover:text-foreground">Kontakt</a></li>
              </ul>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="font-semibold font-display mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/pricing" className="hover:text-foreground">Ceník</a></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold font-display mb-4">Právní</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/terms" className="hover:text-foreground">Podmínky</a></li>
                <li><a href="/privacy" className="hover:text-foreground">Soukromí</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-0 text-center md:text-left">
              © 2024 Naklikam.cz. Všechna práva vyhrazena.
            </div>
            <div className="flex space-x-4 md:space-x-6 text-xs md:text-sm text-muted-foreground">
              <a href="/terms" className="hover:text-foreground">Podmínky</a>
              <a href="/privacy" className="hover:text-foreground">Soukromí</a>
              <a href="/contact" className="hover:text-foreground">Kontakt</a>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Demo Modal */}
      {selectedDemo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-background via-card to-background/95 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-naklikam-purple-500/20 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-naklikam-purple-500/20 bg-gradient-to-r from-naklikam-purple-500/5 to-naklikam-pink-500/5">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-naklikam-purple-600 to-naklikam-pink-600 bg-clip-text text-transparent">
                  {selectedDemo === 'cukrarna' ? 'Cukrárna U Babičky' : 'Socials Brno'}
                </h3>
                <p className="text-muted-foreground font-medium">
                  {selectedDemo === 'cukrarna' ? 'Třebíč • Vytvořeno za 3 minuty' : 'Brno • Vytvořeno za 5 minut'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedDemo(null)}
                className="p-2 hover:bg-naklikam-purple-500/10 rounded-xl transition-colors group"
              >
                <X className="h-6 w-6 text-muted-foreground group-hover:text-naklikam-purple-600" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-transparent to-naklikam-purple-500/5">
              <div className="space-y-6">
                {selectedDemo === 'cukrarna' ? (
                  <>
                    <img src="/cukrarna_hero.webp" alt="Hero sekce cukrárny" className="w-full rounded-xl shadow-lg" />
                    <img src="/cukrarna_speciality.webp" alt="Speciality cukrárny" className="w-full rounded-xl shadow-lg" />
                    <img src="/cukrarna_formular.webp" alt="Kontaktní formulář" className="w-full rounded-xl shadow-lg" />
                    <img src="/cukrarna_footer.webp" alt="Footer cukrárny" className="w-full rounded-xl shadow-lg" />
                    
                    <div className="bg-gradient-to-br from-naklikam-pink-500/10 to-naklikam-purple-500/5 border border-naklikam-pink-500/20 rounded-2xl p-6">
                      <h4 className="font-bold text-foreground mb-4 text-lg">✅ Co web obsahuje:</h4>
                      <ul className="text-muted-foreground space-y-3 font-medium">
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Elegantní hero sekce s kontaktními údaji</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Galerie specialit s fotkami a popisy</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Kontaktní formulář pro objednávky</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Otevírací doba a informace o firmě</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Responzivní design pro mobily</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-pink-500 mt-0.5">•</span>
                          <span>Profesionální růžová barevná paleta</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <img src="/social_hero.webp" alt="Hero sekce social media agentury" className="w-full rounded-xl shadow-lg" />
                    <img src="/social_audit.webp" alt="Audit sekce" className="w-full rounded-xl shadow-lg" />
                    <img src="/social_reference.webp" alt="Reference a výsledky" className="w-full rounded-xl shadow-lg" />
                    <img src="/social_formular.webp" alt="Kontaktní formulář" className="w-full rounded-xl shadow-lg" />
                    
                    <div className="bg-gradient-to-br from-naklikam-purple-500/10 to-naklikam-pink-500/5 border border-naklikam-purple-500/20 rounded-2xl p-6">
                      <h4 className="font-bold text-foreground mb-4 text-lg">✅ Co web obsahuje:</h4>
                      <ul className="text-muted-foreground space-y-3 font-medium">
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Moderní hero s animacemi a statistikami</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Bezplatná analýza jako lead magnet</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Konkrétní reference s výsledky</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Kontaktní formulář s výběrem služeb</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Profesionální design s wow efekty</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-naklikam-purple-500 mt-0.5">•</span>
                          <span>Optimalizované pro konverze</span>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
                
                <div className="text-center pt-4">
                  <Button 
                    onClick={() => {
                      setSelectedDemo(null)
                      document.querySelector('textarea')?.focus()
                    }}
                    className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white text-lg px-8 py-4"
                  >
                    Vytvořit podobný web →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}