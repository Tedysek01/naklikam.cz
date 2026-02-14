import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { HelpCircle, AlertCircle, Copy, RefreshCw, Lightbulb, Code, Bug } from 'lucide-react'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-naklikam-pink-500" />
            Nápověda
          </DialogTitle>
          <DialogDescription>
            Jak efektivně používat AI asistenta pro vývoj aplikací
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Jak správně napsat požadavek */}
          <section>
            <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Jak správně napsat požadavek
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Buďte konkrétní:</strong> Místo "Udělej mi web" napište "Vytvoř landing page s navigací, hero sekcí a kontaktním formulářem"</p>
              <p>• <strong>Popisujte funkce:</strong> "Přidej todo list kde můžu přidávat, odškrtávat a mazat úkoly"</p>
              <p>• <strong>Specifikujte design:</strong> "Použij modré barvy, zaoblené rohy a moderní minimalistický design"</p>
              <p>• <strong>Rozdělte složité úkoly:</strong> Nejdřív požádejte o základní strukturu, pak postupně přidávejte funkce</p>
            </div>
          </section>

          {/* Příklady dobrých promptů */}
          <section>
            <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              Příklady dobrých promptů
            </h3>
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Pro vytvoření komponenty:</p>
                <p className="text-sm text-muted-foreground italic">"Vytvoř komponentu pro zobrazení produktové karty s obrázkem, názvem, cenou a tlačítkem přidat do košíku"</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Pro přidání funkcionality:</p>
                <p className="text-sm text-muted-foreground italic">"Přidej možnost filtrovat produkty podle kategorie a řadit je podle ceny"</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Pro opravu chyby:</p>
                <p className="text-sm text-muted-foreground italic">"Oprav chybu: TypeError: Cannot read property 'map' of undefined na řádku 25"</p>
              </div>
            </div>
          </section>

          {/* Řešení problémů */}
          <section>
            <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              Řešení častých problémů
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <p className="font-medium text-sm mb-1">Vidíte chyby v náhledu?</p>
                <p className="text-sm text-muted-foreground">
                  Jednoduše zkopírujte text chyby a vložte ho do chatu. AI asistent chybu automaticky analyzuje a opraví.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Použijte Ctrl+C pro zkopírování chyby</span>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-sm mb-1">Prázdná bílá obrazovka v náhledu?</p>
                <p className="text-sm text-muted-foreground">
                  Zkuste kliknout na tlačítko refresh <RefreshCw className="h-3 w-3 inline" /> vpravo nahoře v panelu náhledu.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-medium text-sm mb-1">Aplikace se nenačítá?</p>
                <p className="text-sm text-muted-foreground">
                  Počkejte, až se dokončí instalace závislostí. V terminálu uvidíte průběh instalace.
                </p>
              </div>
            </div>
          </section>

          {/* Tipy pro efektivní práci */}
          <section>
            <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-naklikam-pink-500" />
              Tipy pro efektivní práci
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• AI asistent vidí všechny soubory ve vašem projektu a dokáže je upravovat</p>
              <p>• Můžete nahrávat obrázky přetažením nebo kliknutím na tlačítko upload</p>
              <p>• Změny v kódu se automaticky projeví v náhledu</p>
              <p>• Projekt se automaticky ukládá, nemusíte se bát o ztrátu práce</p>
              <p>• Můžete pokračovat v konverzaci a postupně vylepšovat aplikaci</p>
            </div>
          </section>
        </div>

      </DialogContent>
    </Dialog>
  )
}