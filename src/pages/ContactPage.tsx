import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Building2, ExternalLink } from "lucide-react";

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-8"
        >
          ← Zpět na hlavní stránku
        </Button>

        <h1 className="text-4xl font-bold mb-8">Kontakt</h1>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Kontaktní údaje</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">HaulGO s.r.o.</p>
                    <p className="text-sm text-muted-foreground">IČO: 21290661</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>Mládí 4024/15A</p>
                    <p>Mšeno nad Nisou</p>
                    <p>466 04 Jablonec nad Nisou</p>
                    <p>Česká republika</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p><a href="mailto:tadeas@raska.eu" className="text-primary hover:underline">tadeas@raska.eu</a> - Obecné dotazy</p>
                    <p><a href="mailto:dominik@donoven.cz" className="text-primary hover:underline">dominik@donoven.cz</a> - Marketing</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Provozní doba podpory</h2>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
                <p className="mb-2">Pondělí - Pátek: 9:00 - 17:00</p>
                <p className="text-sm text-muted-foreground">
                  Odpovídáme zpravidla do 24 hodin v pracovní dny.
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Řešení sporů</h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
                <p>
                  V případě spotřebitelského sporu máte možnost obrátit se na následující orgány:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Česká obchodní inspekce (ČOI)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Orgán mimosoudního řešení spotřebitelských sporů
                    </p>
                    <a
                      href="https://www.coi.cz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      www.coi.cz
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">Evropská platforma pro řešení sporů online (ODR)</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pro řešení přeshraničních sporů
                    </p>
                    <a
                      href="https://ec.europa.eu/consumers/odr/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      Platforma ODR
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Užitečné odkazy</h2>
              
              <div className="space-y-2">
                <a
                  href="/terms"
                  className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Podmínky užití
                </a>
                <a
                  href="/privacy"
                  className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Zásady ochrany osobních údajů
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Feedback a návrhy</h2>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                <p>
                  Máte nápad na vylepšení nebo jste narazili na problém? Napište nám na{" "}
                  <a href="mailto:tadeas@raska.eu" className="text-primary hover:underline">
                    tadeas@raska.eu
                  </a>
                  . Každá zpětná vazba je pro nás cenná!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}