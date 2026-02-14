import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Logo from '@/components/ui/logo'
import { UserMenu } from '@/components/UserMenu'
import { useAuthStore } from '@/store/authStore'
import { FileText, Image, Video, ArrowLeft, Sparkles, Check, History, Info, Coins, Package } from 'lucide-react'
import TextGenerator from '@/components/content/TextGenerator'
import ImageGenerator from '@/components/content/ImageGenerator'
import VideoGenerator from '@/components/content/VideoGenerator'
import ContentHistory from '@/components/content/ContentHistory'
import { ContentStripeCheckout } from '@/components/ContentStripeCheckout'
import { CONTENT_PLANS, type ContentPlanType } from '@/config/stripe.config'

export default function ContentMarketingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeSection, setActiveSection] = useState<'texts' | 'images' | 'videos' | 'pricing' | 'history' | null>(null)
  const [showPricing, setShowPricing] = useState(false)

  const sections = [
    {
      id: 'texts',
      title: 'Texty',
      description: 'Texty na web a marketing',
      icon: FileText,
      color: 'from-naklikam-purple-500 to-naklikam-purple-600',
      features: [
        'Texty na web (homepage, služby, o nás)',
        'CTA texty a slogany',
        'FB/IG posty',
        'E-mail kampaně',
        'Blog články'
      ]
    },
    {
      id: 'images',
      title: 'Obrázky',
      description: 'Vizuální obsah pro web a sociální sítě',
      icon: Image,
      color: 'from-naklikam-pink-500 to-naklikam-pink-600',
      features: [
        'Hero obrázky',
        'Ikony služeb/produktů',
        'Bannery na sociální sítě',
        'Produktové fotky',
        'Infografiky'
      ]
    },
    {
      id: 'videos',
      title: 'Videa',
      description: 'Dynamický obsah pro marketing',
      icon: Video,
      color: 'from-naklikam-pink-500 to-naklikam-purple-500',
      features: [
        'Krátké reklamní spoty',
        'FB/IG Reels',
        'Promo videa pro web',
        'Intro/outro animace',
        'Produktová videa'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                Web
              </Button>
              <Button 
                variant="ghost" 
                className="bg-naklikam-gradient text-white"
              >
                Obsah & Marketing
              </Button>
              {user?.subscription?.contentAddon && (
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveSection('history')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <History size={16} className="mr-1" />
                  Historie
                </Button>
              )}
            </div>
          </div>
          <UserMenu />
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-4 md:py-6 lg:py-8">
        {!activeSection ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                Obsah & Marketing
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Vytvořte si texty, obrázky a videa pro váš web a marketing – vše na jednom místě
              </p>
            </div>

            {/* Section Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <div 
                    key={section.id}
                    className="cursor-pointer transition-all duration-300 group"
                    onClick={() => setActiveSection(section.id as any)}
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 hover:border-naklikam-pink-400/60 hover:shadow-xl hover:shadow-naklikam-pink-500/20 group-hover:-translate-y-1">
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
                      <div className="relative p-6">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon size={28} />
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-naklikam-pink-300 transition-colors">
                          {section.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-base text-slate-300 mb-4 leading-relaxed">
                          {section.description}
                        </p>
                        
                        {/* Features */}
                        <ul className="space-y-2 mb-6">
                          {section.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.color} mt-2 flex-shrink-0`}></div>
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* CTA Button */}
                        <div className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${section.color} text-white font-semibold text-center group-hover:shadow-lg transition-all duration-300`}>
                          Začít generovat
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Info Box - always show */}
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl shadow-xl shadow-purple-500/20 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        Váš content plán
                      </h3>
                      <p className="text-purple-100 text-sm">
                        Generujte obsah pomocí kreditů
                      </p>
                    </div>
                    {user?.subscription?.contentAddon ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPricing(true)}
                        className="border-purple-400/50 text-purple-100 hover:bg-purple-900/50"
                      >
                        Změnit plán
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowPricing(true)}
                        className="bg-naklikam-gradient hover:opacity-90"
                      >
                        Aktivovat plán
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Credits Card */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Zbývající kredity</span>
                        <Coins size={16} className="text-yellow-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {user?.subscription?.credits || 0}
                      </div>
                      <div className="text-xs text-slate-500">
                        z {user?.subscription?.contentAddon ? 
                          (user.subscription.contentAddon.plan === 'content_basic' ? '100' :
                           user.subscription.contentAddon.plan === 'content_pro' ? '500' : '1500')
                          : '0'} měsíčních
                      </div>
                    </div>
                    
                    {/* Plan Card */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Zdroj kreditů</span>
                        <Package size={16} className="text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1 capitalize">
                        {user?.subscription?.contentAddon ? 
                          user.subscription.contentAddon.plan.replace('content_', '').replace('_', ' ') : 
                          'Žádný'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user?.subscription?.contentAddon ? 
                          'Content addon aktivní' : 
                          'Aktivujte si content plán'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Usage Examples */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText size={12} />
                      <span>Text: 5-10 kreditů</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Image size={12} />
                      <span>Obrázek: 15-30 kreditů</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Video size={12} />
                      <span>Video: 50-100 kreditů</span>
                    </div>
                  </div>
                  
                  {user?.subscription?.contentAddon ? (
                    <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-yellow-400" />
                        <span className="text-xs text-yellow-100">
                          Kredity se obnovují každý měsíc. Nevyužité kredity se nepřevádějí.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                      <div className="flex items-start gap-3">
                        <Info size={16} className="text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-white font-medium mb-2">
                            Aktivujte si content plán a začněte generovat obsah
                          </p>
                          {user?.subscription?.plan && user?.subscription?.plan !== 'trial' && user?.subscription?.plan !== 'free' && (
                            <p className="text-xs text-purple-200 mb-2">
                              S vaším web plánem <span className="font-semibold capitalize">{user.subscription.plan}</span> získáte 20% slevu!
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-purple-200">
                            <div className="flex items-center gap-1">
                              <Check size={12} className="text-green-400" />
                              <span>Bez skrytých poplatků</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Check size={12} className="text-green-400" />
                              <span>Měsíční kredity</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Check size={12} className="text-green-400" />
                              <span>Okamžitý přístup</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Pricing Modal */}
            {showPricing && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Plány na obsah</h2>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPricing(false)}
                        className="text-white hover:bg-white/10"
                      >
                        ✕
                      </Button>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {(Object.keys(CONTENT_PLANS) as ContentPlanType[]).map((planKey) => {
                        const plan = CONTENT_PLANS[planKey]
                        const isAddon = user?.subscription && user.subscription.plan !== 'trial'
                        const price = isAddon ? plan.addonPrice : plan.price
                        const hasThisPlan = user?.subscription?.contentAddon?.plan === `content_${planKey}`
                        
                        return (
                          <Card key={planKey} className="bg-slate-800 border-slate-700">
                            <CardHeader>
                              <CardTitle className="text-white">{plan.name}</CardTitle>
                              <div className="mt-4">
                                <span className="text-3xl font-bold text-white">{price} Kč</span>
                                <span className="text-slate-400">/měsíc</span>
                                {isAddon && (
                                  <div className="mt-2 text-sm text-green-400">
                                    Sleva 20% jako rozšíření k web plánu!
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {hasThisPlan ? (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="w-full opacity-50"
                                >
                                  Již aktivní
                                </Button>
                              ) : (
                                <ContentStripeCheckout
                                  plan={planKey}
                                  isAddon={isAddon}
                                  highlighted={planKey === 'pro'}
                                />
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setActiveSection(null)}
              className="mb-6"
            >
              <ArrowLeft size={20} className="mr-2" />
              Zpět
            </Button>
            
            {activeSection === 'texts' && <TextGenerator />}
            {activeSection === 'images' && <ImageGenerator />}
            {activeSection === 'videos' && <VideoGenerator />}
            {activeSection === 'history' && <ContentHistory />}
            {activeSection === 'pricing' && (
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">Plány na obsah</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {(Object.keys(CONTENT_PLANS) as ContentPlanType[]).map((planKey) => {
                    const plan = CONTENT_PLANS[planKey]
                    const isAddon = user?.subscription && user.subscription.plan !== 'trial'
                    const price = isAddon ? plan.addonPrice : plan.price
                    const hasThisPlan = user?.subscription?.contentAddon?.plan === `content_${planKey}`
                    
                    return (
                      <Card key={planKey} className="bg-slate-800 border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-white">{plan.name}</CardTitle>
                          <div className="mt-4">
                            <span className="text-3xl font-bold text-white">{price} Kč</span>
                            <span className="text-slate-400">/měsíc</span>
                            {isAddon && (
                              <div className="mt-2 text-sm text-green-400">
                                Sleva 20% jako rozšíření k web plánu!
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {hasThisPlan ? (
                            <Button
                              disabled
                              variant="outline"
                              className="w-full opacity-50"
                            >
                              Již aktivní
                            </Button>
                          ) : (
                            <ContentStripeCheckout
                              plan={planKey}
                              isAddon={isAddon}
                              highlighted={planKey === 'pro'}
                            />
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

