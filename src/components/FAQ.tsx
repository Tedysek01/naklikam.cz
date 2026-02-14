import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: "Potřebuji umět programovat?",
    answer: "Ne! Naklikam.cz je navržen tak, aby ho mohl používat kdokoliv bez znalosti programování. Stačí popsat, co chcete vytvořit, a AI se postará o zbytek."
  },
  {
    question: "Jak rychle vznikne můj web nebo aplikace?",
    answer: "Většina projektů je hotová během několika minut. Jednoduchý web může být připravený už za 60 sekund, složitější aplikace mohou trvat 5-10 minut."
  },
  {
    question: "Mohu exportovat vygenerovaný kód?",
    answer: "Ano! Máte plný přístup ke všemu vygenerovanému kódu. Můžete ho stáhnout, upravovat nebo použít jinde. Žádné vendor lock-in."
  },
  {
    question: "Je moje data a kód v bezpečí?",
    answer: "Absolutně. Všechna data jsou šifrována a ukládána na bezpečných serverech. Váš kód zůstává váš a nikdo jiný k němu nemá přístup."
  },
  {
    question: "Co když mi dojdou tokeny?",
    answer: "Můžete si kdykoliv dokoupit další tokeny podle potřeby. Tokeny nevyprší, takže je můžete využít kdykoliv v budoucnu."
  },
  {
    question: "Funguje to i pro složité aplikace?",
    answer: "Ano! AI zvládne vytvořit i komplexní aplikace s databází, autentifikací, platbami a dalšími pokročilými funkcemi."
  },
  {
    question: "Mohu upravovat vygenerovaný web?",
    answer: "Samozřejmě! Můžete jednoduše popsat, co chcete změnit, a AI upraví web podle vašich požadavků. Nebo si můžete kód stáhnout a upravit manuálně."
  },
  {
    question: "Podporujete jiné jazyky než češtinu?",
    answer: "Momentálně podporujeme češtinu a angličtinu. Plánujeme rozšíření o další jazyky v blízké budoucnosti."
  }
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <div className="mt-24 md:mt-32">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
          Často kladené otázky
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
          Odpovědi na nejčastější dotazy o Naklikam.cz
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-naklikam-pink-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openItems.includes(index) && (
                <div className="px-6 pb-4 text-muted-foreground animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}