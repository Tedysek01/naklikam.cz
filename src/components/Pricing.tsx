import { Check, Zap } from 'lucide-react'
import { StripeCheckout } from '@/components/StripeCheckout'
import { useState } from 'react'

const plans = [
  {
    name: "Vyzkoušej si mě",
    planId: "trial",
    tokens: "100k",
    monthlyPrice: "79",
    annualPrice: null, // Trial nemá smysl na rok
    description: "Základ webu na ukázku",
    features: [
      "Export projektu jako ZIP",
      "Základní kostra webu",
      "Přístup ke kódu",
      "100k AI tokenů"
    ],
    highlighted: false,
    isTrial: true
  },
  {
    name: "Postav si web",
    planId: "pro",
    tokens: "2M",
    monthlyPrice: "649",
    annualPrice: "6 490", // 10 měsíců za cenu 12
    description: "Stačí na jeden web",
    features: [
      "Deployment na vlastní doménu",
      "2M AI tokenů",
      "Email podpora",
      "Základní tutoriály",
      "Export + upload"
    ],
    highlighted: false
  },
  {
    name: "Buduj byznys", 
    planId: "business",
    tokens: "5M+",
    monthlyPrice: "1 390",
    annualPrice: "13 900", // 10 měsíců za cenu 12
    description: "3 weby nebo 1 aplikace",
    features: [
      "Deployment na vlastní doménu",
      "5M+ AI tokenů",
      "Komplexní SaaS aplikace",
      "Telefonní + email podpora",
      "Pokročilé tutoriály"
    ],
    highlighted: true
  },
  {
    name: "Unlimited",
    planId: "unlimited",
    tokens: "∞",
    monthlyPrice: "4 970",
    annualPrice: "49 700", // 10 měsíců za cenu 12
    description: "Pro agentury",
    features: [
      "Deployment na vlastní doménu",
      "Neomezené AI tokeny",
      "Neomezené projekty",
      "VIP podpora 24/7",
      "Dedikovaný manager"
    ],
    highlighted: false
  }
]

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="mt-16 md:mt-24">
      <div className="text-center mb-8 md:mb-12 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
          Jednoduché a transparentní ceny
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Plaťte pouze za tokeny, které skutečně využijete
        </p>
        
        {/* Monthly/Annual Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Měsíčně
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-naklikam-pink-500 focus:ring-offset-2 ${
              isAnnual ? 'bg-naklikam-gradient' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Ročně
            </span>
            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
              -17%
            </span>
          </div>
        </div>
      </div>

      {/* All 4 main plans side by side */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice
            const showPlan = !isAnnual || plan.annualPrice !== null // Skryj trial pokud je annual
            
            if (!showPlan) return null
            
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-6 border transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-400/50 shadow-xl shadow-purple-500/20 text-white'
                    : 'bg-card border-border hover:shadow-lg'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-naklikam-gradient text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                    ⭐ Nejoblíbenější
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className={`text-xl font-bold font-display mb-2 ${
                    plan.highlighted ? 'text-white' : 'text-foreground'
                  }`}>{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-3">
                    <span className={`text-3xl font-bold ${
                      plan.highlighted
                        ? 'text-white'
                        : 'text-foreground'
                    }`}>
                      {currentPrice}
                    </span>
                    <span className={`text-sm ${
                      plan.highlighted ? 'text-purple-200' : 'text-muted-foreground'
                    }`}>Kč/{isAnnual && !plan.isTrial ? 'rok' : (plan.isTrial ? '' : 'měsíc')}</span>
                  </div>
                  <div className={`flex items-center justify-center gap-1 text-sm mb-2 ${
                    plan.highlighted ? 'text-purple-200' : 'text-muted-foreground'
                  }`}>
                    <Zap className={`h-4 w-4 ${
                      plan.highlighted ? 'text-purple-400' : 'text-naklikam-pink-500'
                    }`} />
                    <span>{plan.tokens} tokenů</span>
                  </div>
                  <p className={`text-sm ${
                    plan.highlighted ? 'text-purple-200' : 'text-muted-foreground'
                  }`}>{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? 'text-green-400' : 'text-naklikam-pink-500'
                      }`} />
                      <span className={plan.highlighted ? 'text-gray-200' : 'text-muted-foreground'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <StripeCheckout 
                  plan={plan.planId as 'trial' | 'pro' | 'business' | 'unlimited'}
                  highlighted={plan.highlighted}
                  isTrial={plan.isTrial}
                  isAnnual={isAnnual && !plan.isTrial}
                  className="w-full py-3"
                >
                  Vybrat {plan.name}
                </StripeCheckout>
              </div>
            )
          })}
        </div>
      </div>

      {/* Enterprise section */}
      <div className="max-w-2xl mx-auto px-4 mt-12">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-slate-600 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
          <p className="text-slate-300 mb-4">Pro velké firmy</p>
          <p className="text-slate-400 text-sm mb-4">Cena na míru</p>
          <a 
            href="mailto:tadeas@raska.eu?subject=Enterprise%20plán" 
            className="inline-flex items-center justify-center px-6 py-3 bg-naklikam-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Kontaktovat nás
          </a>
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Všechny ceny jsou uvedeny včetně DPH. Nevyužité tokeny se převádí do dalšího měsíce.</p>
      </div>
    </div>
  )
}