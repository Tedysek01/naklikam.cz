import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { SubscriptionStatus } from '@/components/SubscriptionStatus'
import { BillingManagement } from '@/components/BillingManagement' 
import { ArrowLeft, MousePointer2, Check, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StripeCheckout } from '@/components/StripeCheckout'
import { getPlanPrice } from '@/services/subscriptionService'

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
    isTrial: true
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
    highlighted: false
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
    highlighted: true
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
    highlighted: false
  }
]

interface PricingPlansProps {
  currentUserPlan?: string
  userSubscription?: any // Pro přístup k createdAt
}

function PricingPlans({ currentUserPlan, userSubscription }: PricingPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan, index) => {
        const isCurrentPlan = currentUserPlan?.toLowerCase() === plan.planId.toLowerCase()
        
        // Zobraz správnou cenu podle toho jestli je zákazník legacy
        const displayPrice = userSubscription?.createdAt 
          ? getPlanPrice(plan.planId as any, userSubscription.createdAt)
          : parseInt(plan.price.replace(' ', ''))
        
        const formattedPrice = displayPrice.toLocaleString('cs-CZ')
        
        return (
          <div
            key={index}
            className={`relative rounded-2xl p-6 border transition-all duration-200 ${
              plan.highlighted && !isCurrentPlan
                ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-400/50 shadow-xl shadow-purple-500/20 text-white'
                : isCurrentPlan
                ? 'bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 border-green-400/50 shadow-xl shadow-green-500/20 text-white'
                : 'bg-card border-border hover:shadow-lg'
            }`}
          >
            {plan.highlighted && !isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-naklikam-gradient text-white px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                ⭐ Nejoblíbenější
              </div>
            )}
            {isCurrentPlan && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                ✓ Aktivní plán
              </div>
            )}

            <div className="text-center mb-4">
              <h3 className={`text-xl font-bold font-display mb-2 ${
                plan.highlighted || isCurrentPlan ? 'text-white' : 'text-foreground'
              }`}>{plan.name}</h3>
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className={`text-3xl font-bold ${
                  plan.highlighted || isCurrentPlan
                    ? 'text-white'
                    : 'text-foreground'
                }`}>
                  {formattedPrice}
                </span>
                <span className={`text-sm ${
                  plan.highlighted ? 'text-purple-200' : isCurrentPlan ? 'text-green-200' : 'text-muted-foreground'
                }`}>Kč/měsíc</span>
              </div>
              <div className={`flex items-center justify-center gap-1 text-sm mb-2 ${
                plan.highlighted ? 'text-purple-200' : isCurrentPlan ? 'text-green-200' : 'text-muted-foreground'
              }`}>
                <Zap className={`h-4 w-4 ${
                  plan.highlighted ? 'text-purple-400' : isCurrentPlan ? 'text-green-400' : 'text-naklikam-pink-500'
                }`} />
                <span>{plan.tokens} tokenů</span>
              </div>
              <p className={`text-sm ${
                plan.highlighted ? 'text-purple-200' : isCurrentPlan ? 'text-green-200' : 'text-muted-foreground'
              }`}>{plan.description}</p>
            </div>

            <ul className="space-y-2 mb-6 text-sm">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-2">
                  <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    plan.highlighted || isCurrentPlan ? 'text-green-400' : 'text-naklikam-pink-500'
                  }`} />
                  <span className={plan.highlighted || isCurrentPlan ? 'text-gray-200' : 'text-muted-foreground'}>{feature}</span>
                </li>
              ))}
            </ul>

            {isCurrentPlan ? (
              <Button 
                disabled 
                className="w-full bg-green-900/30 text-green-300 cursor-not-allowed hover:bg-green-900/30 py-3"
              >
                <Crown className="h-4 w-4 mr-2" />
                Současný plán
              </Button>
            ) : (
              <StripeCheckout 
                plan={plan.planId as 'trial' | 'pro' | 'business' | 'unlimited'}
                highlighted={plan.highlighted}
                isTrial={plan.isTrial}
                className="w-full py-3"
              >
                Vybrat {plan.name}
              </StripeCheckout>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()


  if (!user) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět na dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <div className="bg-naklikam-gradient p-2 rounded-lg">
                <MousePointer2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold font-display bg-naklikam-gradient bg-clip-text text-transparent">
                Předplatné
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground font-display">Správa předplatného</h1>
            <p className="text-muted-foreground mt-2">
              Spravujte své předplatné, tokeny a platební údaje
            </p>
            <div className="mt-4 p-6 bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl shadow-xl shadow-purple-500/20 backdrop-blur-xl">
              <div className="flex items-center gap-3 text-white mb-3">
                <div className="w-8 h-8 bg-naklikam-gradient rounded-xl flex items-center justify-center">
                  <MousePointer2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Vyberte si předplatné</h3>
              </div>
              <p className="text-purple-100 text-sm leading-relaxed">
                Pro používání Naklikam.cz je potřeba aktivní předplatné. Doporučujeme <strong className="text-white text-base">Trial plán za 70 Kč</strong> pro vyzkoušení.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Subscription status and billing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubscriptionStatus />
              <BillingManagement />
            </div>

            {/* Pricing Plans */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-naklikam-pink-600 flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Dostupné plány
              </h3>
              <PricingPlans 
                currentUserPlan={user.subscription?.plan}
                userSubscription={user.subscription}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}