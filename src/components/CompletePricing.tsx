import { Check, Zap } from 'lucide-react'
import { CompleteStripeCheckout } from '@/components/CompleteStripeCheckout'

const plans = [
  {
    name: "Vyzkoušej si mě",
    planId: "trial",
    tokens: "100k",
    price: "79",
    description: "Základ webu na ukázku",
    features: [
      "Export projektu jako ZIP",
      "Základní kostra webu",
      "Přístup ke kódu",
      "100k AI tokenů"
    ],
    highlighted: false,
    isTrial: true,
    available: true
  },
  {
    name: "Postav si web",
    planId: "pro",
    tokens: "2M",
    price: "649",
    description: "Stačí na jeden web",
    features: [
      "Deployment na vlastní doménu",
      "2M AI tokenů",
      "Email podpora",
      "Základní tutoriály",
      "Export + upload"
    ],
    highlighted: false,
    available: true
  },
  {
    name: "Buduj byznys", 
    planId: "business",
    tokens: "5M+",
    price: "1 390",
    description: "3 weby nebo 1 aplikace",
    features: [
      "Deployment na vlastní doménu",
      "5M+ AI tokenů",
      "Komplexní SaaS aplikace",
      "Telefonní + email podpora",
      "Pokročilé tutoriály"
    ],
    highlighted: true,
    available: true
  },
  {
    name: "Unlimited",
    planId: "unlimited",
    tokens: "∞",
    price: "4 970",
    description: "Pro agentury",
    features: [
      "Deployment na vlastní doménu",
      "Neomezené AI tokeny",
      "Neomezené projekty",
      "VIP podpora 24/7",
      "Dedikovaný manager"
    ],
    highlighted: false,
    available: true
  },
  {
    name: "Enterprise",
    planId: "enterprise",
    tokens: "Custom",
    price: "Na míru",
    description: "Pro velké firmy",
    features: [
      "Individuální řešení",
      "Dedikovaná podpora",
      "SLA garance"
    ],
    highlighted: false,
    available: true,
    isEnterprise: true
  },
  {
    name: "Starter",
    planId: "starter",
    tokens: "2M",
    price: "580",
    description: "Legacy plán - původní cena",
    features: [
      "2M AI tokenů",
      "Email podpora",
      "Export kódu"
    ],
    highlighted: false,
    available: true,
    discontinued: true
  },
  {
    name: "Professional",
    planId: "professional",
    tokens: "5M",
    price: "1 290",
    description: "Legacy plán - původní cena",
    features: [
      "5M AI tokenů",
      "Prioritní podpora",
      "Export kódu"
    ],
    highlighted: false,
    available: true,
    discontinued: true
  }
]

export default function CompletePricing() {
  return (
    <div className="mt-16 md:mt-24">
      <div className="text-center mb-8 md:mb-12 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
          Kompletní ceník - všechny plány
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Včetně dříve dostupných plánů Business a Unlimited
        </p>
      </div>

      {/* All 5 plans in a responsive grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-6 border transition-all duration-200 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-400/50 shadow-xl shadow-purple-500/20 text-white'
                  : plan.discontinued
                  ? 'bg-card/50 border-border/50 opacity-90'
                  : plan.isEnterprise
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 text-white'
                  : 'bg-card border-border hover:shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-naklikam-gradient text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                  ⭐ Nejoblíbenější
                </div>
              )}
              
              {plan.discontinued && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Dříve dostupný
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className={`text-xl font-bold font-display mb-2 ${
                  plan.highlighted || plan.isEnterprise ? 'text-white' : 'text-foreground'
                }`}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  <span className={`text-3xl font-bold ${
                    plan.highlighted || plan.isEnterprise
                      ? 'text-white'
                      : 'text-foreground'
                  }`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${
                    plan.highlighted ? 'text-purple-200' : plan.isEnterprise ? 'text-slate-300' : 'text-muted-foreground'
                  }`}>{plan.isEnterprise ? '' : 'Kč/měsíc'}</span>
                </div>
                <div className={`flex items-center justify-center gap-1 text-sm mb-2 ${
                  plan.highlighted ? 'text-purple-200' : plan.isEnterprise ? 'text-slate-300' : 'text-muted-foreground'
                }`}>
                  <Zap className={`h-4 w-4 ${
                    plan.highlighted ? 'text-purple-400' : plan.isEnterprise ? 'text-slate-400' : 'text-naklikam-pink-500'
                  }`} />
                  <span>{plan.tokens} {plan.isEnterprise ? '' : 'tokenů'}</span>
                </div>
                <p className={`text-sm ${
                  plan.highlighted ? 'text-purple-200' : plan.isEnterprise ? 'text-slate-300' : 'text-muted-foreground'
                }`}>{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6 text-sm">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      plan.highlighted || plan.isEnterprise ? 'text-green-400' : 'text-naklikam-pink-500'
                    }`} />
                    <span className={plan.highlighted || plan.isEnterprise ? 'text-gray-200' : 'text-muted-foreground'}>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.isEnterprise ? (
                <a 
                  href="mailto:tadeas@raska.eu?subject=Enterprise%20plán" 
                  className="inline-flex items-center justify-center w-full py-3 bg-naklikam-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Kontaktovat nás
                </a>
              ) : (
                <CompleteStripeCheckout 
                  plan={plan.planId as 'trial' | 'pro' | 'business' | 'unlimited' | 'starter' | 'professional'}
                  highlighted={plan.highlighted}
                  isTrial={plan.isTrial}
                  className="w-full py-3"
                >
                  Vybrat {plan.name}
                </CompleteStripeCheckout>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Všechny ceny jsou uvedeny včetně DPH. Nevyužité tokeny se převádí do dalšího měsíce.</p>
        <p className="mt-2">Legacy plány zůstávají dostupné pro stávající zákazníky.</p>
      </div>
    </div>
  )
}