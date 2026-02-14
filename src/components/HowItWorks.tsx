import { MessageSquare, Sparkles, Edit3, Globe } from 'lucide-react'

const steps = [
  {
    icon: MessageSquare,
    title: "Popište svůj nápad",
    description: "Napište, co chcete vytvořit - web, aplikaci nebo e-shop",
    step: "01"
  },
  {
    icon: Sparkles,
    title: "AI vygeneruje kód",
    description: "Umělá inteligence vytvoří kompletní funkční aplikaci",
    step: "02"
  },
  {
    icon: Edit3,
    title: "Upravte podle potřeby",
    description: "Vylaďte design a funkce přesně podle vašich představ",
    step: "03"
  },
  {
    icon: Globe,
    title: "Publikujte online",
    description: "Jedním kliknutím spusťte svůj projekt na vlastní doméně",
    step: "04"
  }
]

export default function HowItWorks() {
  return (
    <div className="mt-24 md:mt-32">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
          Jak to funguje?
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Od nápadu k fungující aplikaci ve 4 jednoduchých krocích
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative h-full">
              {/* Step card */}
              <div className="bg-card border border-border rounded-2xl p-6 hover:border-naklikam-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-naklikam-pink-500/10 group h-full flex flex-col">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-naklikam-gradient rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{step.step}</span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 bg-naklikam-pink-500/10 rounded-2xl flex items-center justify-center group-hover:bg-naklikam-pink-500/20 transition-colors flex-shrink-0">
                  <step.icon className="h-8 w-8 text-naklikam-pink-500" />
                </div>

                {/* Content */}
                <div className="text-center flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold font-display text-foreground mb-3 group-hover:text-naklikam-pink-500 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom description */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm max-w-3xl mx-auto">
            Celý proces trvá pouhé minuty. Začněte hned teď a přesvědčte se, jak jednoduché může být vytváření moderních aplikací.
          </p>
        </div>
      </div>
    </div>
  )
}