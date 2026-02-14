import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-8">Zásady zpracování osobních údajů</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">
            Verze: 2.0 | Účinné od: 7. 8. 2025 | V souladu s GDPR a AI Act
          </p>

          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 mb-6">
            <p className="text-slate-200">
              Tyto zásady jsou zpracovány v souladu s nařízením EU 2016/679 (GDPR), zákonem č. 110/2019 Sb. o zpracování osobních údajů a nařízením EU 2024/1689 (AI Act).
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Základní informace o správci</h2>
            <p>
              <strong>Správce osobních údajů podle čl. 4 bod 7 GDPR:</strong>
            </p>
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-lg mt-2">
              <p className="text-slate-200"><strong>HaulGO s.r.o.</strong></p>
              <p className="text-slate-300">IČO: 21290661, DIČ: CZ21290661</p>
              <p className="text-slate-300">Sídlo: Mládí 4024/15A, Mšeno nad Nisou, 466 04 Jablonec nad Nisou</p>
              <p className="text-slate-300">Zápis: Krajský soud v Ústí nad Labem, oddíl C, vložka 50831</p>
              <p className="text-slate-300">Kontakt pro GDPR: <a href="mailto:tadeas@raska.eu" className="text-primary hover:underline">tadeas@raska.eu</a></p>
              <p className="text-slate-300">Telefon: k dispozici na webových stránkách</p>
            </div>
            <p className="mt-4">
              <strong>Poznámka:</strong> Vzhledem k velikosti organizace není jmenován pověřenec pro ochranu osobních údajů (DPO) ve smyslu čl. 37 GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Kategorie zpracovávaných osobních údajů</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Identifikační údaje</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>E-mailová adresa (povinný údaj)</li>
              <li>Jméno a příjmení (volitelné)</li>
              <li>Uživatelské jméno/přezdívka</li>
              <li>Avatar/profilový obrázek (pokud nahrajete)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Technické a provozní údaje</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>IP adresa a geolokační údaje (země/region)</li>
              <li>Identifikátory zařízení a prohlížeče</li>
              <li>Informace o operačním systému a rozlišení obrazovky</li>
              <li>Časové razítko přístupů</li>
              <li>Referrer (odkud přišel uživatel)</li>
              <li>Cookies a obdobné technologie (viz sekce 11)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Údaje o používání služby</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Dotazy zadávané do AI systému (prompty)</li>
              <li>Vygenerovaný obsah a kód</li>
              <li>Historie projektů a souborů</li>
              <li>Nastavení a preference uživatele</li>
              <li>Statistiky používání funkcí</li>
              <li>Logy chyb a výkonu systému</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.4 Platební a fakturační údaje</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Platební historie (bez údajů o kartě)</li>
              <li>Fakturační adresa</li>
              <li>DIČ/IČO (pro podnikatele)</li>
              <li>Informace o předplatném a využití služeb</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.5 Komunikační údaje</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Komunikace se zákaznickou podporou</li>
              <li>Feedback a hodnocení služby</li>
              <li>Odpovědi na průzkumy spokojenosti</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Právní základ a účely zpracování</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Vytvoření a správa uživatelského účtu</li>
              <li>Poskytování AI služeb a generování obsahu</li>
              <li>Ukládání a správa projektů uživatele</li>
              <li>Zákaznická podpora a technická pomoc</li>
              <li>Zpracování plateb a vystavování faktur</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR)</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Zajištění bezpečnosti a ochrany před zneužitím</li>
              <li>Prevence podvodů a neoprávněného přístupu</li>
              <li>Zlepšování kvality a výkonu AI systémů (anonymizovaně)</li>
              <li>Analýza používání pro optimalizaci služby</li>
              <li>Technická údržba a monitoring systémů</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Souhlas (čl. 6 odst. 1 písm. a) GDPR)</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Marketingová komunikace (newsletter, produktové novinky)</li>
              <li>Nepovinné cookies pro analýzu návštěvnosti</li>
              <li>Účast v beta testování nových funkcí</li>
              <li>Personalizované doporučení obsahu</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Plnění právní povinnosti (čl. 6 odst. 1 písm. c) GDPR)</h3>
            <ul className="list-disc ml-6 space-y-1">
              <li>Vedení účetních dokladů (zákon č. 563/1991 Sb.)</li>
              <li>Plnění daňových povinností (zákon č. 280/2009 Sb.)</li>
              <li>Archivace smluv a dokumentace</li>
              <li>Plnění požadavků dozorových orgánů</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI systémy a automatizované zpracování</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">4.1 Použité AI systémy</h3>
            <p>Služba využívá následující AI systémy v souladu s nařízením EU 2024/1689 (AI Act):</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Claude (Anthropic):</strong> Generování kódu a odpovědí na dotazy uživatelů</li>
              <li><strong>Interní algoritmy:</strong> Analýza a optimalizace uživatelského obsahu</li>
              <li><strong>Analytické nástroje:</strong> Sledování výkonu a používání platformy</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">4.2 Transparentnost AI zpracování (čl. 13 AI Act)</h3>
            <p><strong>Informujeme, že:</strong></p>
            <ul className="list-disc ml-6 space-y-2">
              <li>AI systém generuje pouze návrhy a doporučení, nikoliv závazná rozhodnutí</li>
              <li>Všechny výstupy podléhají kontrole a schválení uživatele</li>
              <li>AI má omezení: může generovat nepřesný obsah, nemá přístup k aktuálním datům</li>
              <li>Systém neprovádí profilování s právními nebo obdobnými účinky</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">4.3 Automatizované rozhodování (čl. 22 GDPR)</h3>
            <p>
              <strong>Prohlašujeme, že nevykonáváme automatizované rozhodování</strong> ve smyslu čl. 22 GDPR, které by mělo právní účinky nebo významně ovlivňovalo uživatele. Všechna rozhodnutí podléhají lidskému dohledu.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">4.4 Trénování AI modelů</h3>
            <p>
              Vaše prompty a generovaný obsah můžeme využít pro zlepšování AI modelů pouze v anonymizované podobě, která neumožňuje identifikaci uživatele.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Příjemci a předávání údajů</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">5.1 Zpracovatelé v EU/EEA</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Google Cloud Platform/Firebase:</strong> Hosting databáze a aplikace (Irsko)</li>
              <li><strong>Stripe:</strong> Zpracování plateb (Irsko)</li>
              <li><strong>Cloudflare:</strong> CDN a ochrana před útoky (různé země EU)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">5.2 Předávání do třetích zemí</h3>
            <p><strong>S odpovídajícími zárukami podle čl. 44-49 GDPR:</strong></p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Anthropic (USA):</strong> AI služby Claude - rozhodnutí o odpovídající ochraně, standardní smluvní doložky</li>
              <li><strong>GitHub (USA):</strong> Správa kódu a verzování - Microsoft Cloud, standardní smluvní doložky</li>
              <li><strong>Vercel (USA):</strong> Deployment služby - standardní smluvní doložky</li>
            </ul>
            <p>
              Všichni zpracovatelé ve třetích zemích jsou vázáni standardními smluvními doložkami schválenými Evropskou komisí.
            </p>

            <h3 className="text-xl font-semibold mt-4 mb-3">5.3 Sdílení s orgány veřejné moci</h3>
            <p>
              Osobní údaje předáváme orgánům veřejné moci pouze na základě právního titulu (soudní příkaz, požadavek policie v trestním řízení apod.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Doba uchovávání údajů</h2>
            
            <table className="w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Kategorie údajů</th>
                  <th className="border border-gray-300 p-2 text-left">Doba uchovávání</th>
                  <th className="border border-gray-300 p-2 text-left">Právní základ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Údaje uživatelského účtu</td>
                  <td className="border border-gray-300 p-2">Aktivní účet + 3 roky</td>
                  <td className="border border-gray-300 p-2">Oprávněný zájem, promlčení nároků</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Platební a fakturační údaje</td>
                  <td className="border border-gray-300 p-2">10 let</td>
                  <td className="border border-gray-300 p-2">Zákon o účetnictví (563/1991 Sb.)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Projekty a vygenerovaný obsah</td>
                  <td className="border border-gray-300 p-2">Aktivní účet + 1 rok</td>
                  <td className="border border-gray-300 p-2">Plnění smlouvy</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Logy a technické údaje</td>
                  <td className="border border-gray-300 p-2">1 rok</td>
                  <td className="border border-gray-300 p-2">Oprávněný zájem, bezpečnost</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Komunikace se podporou</td>
                  <td className="border border-gray-300 p-2">3 roky</td>
                  <td className="border border-gray-300 p-2">Oprávněný zájem, řešení sporů</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Marketingové údaje</td>
                  <td className="border border-gray-300 p-2">Do odvolání souhlasu</td>
                  <td className="border border-gray-300 p-2">Souhlas</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Vaše práva podle GDPR</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">7.1 Právo na přístup (čl. 15 GDPR)</h3>
            <p>Máte právo získat informace o tom, zda zpracováváme vaše osobní údaje, a pokud ano, pak k jakým údajům máme přístup a jak je zpracováváme.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.2 Právo na opravu (čl. 16 GDPR)</h3>
            <p>Máte právo požádat o opravu nepřesných osobních údajů nebo doplnění neúplných údajů.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.3 Právo na výmaz (čl. 17 GDPR)</h3>
            <p>Máte právo požádat o smazání osobních údajů, pokud:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Údaje již nejsou potřebné pro původní účely zpracování</li>
              <li>Odvolávate souhlas a neexistuje jiný právní základ</li>
              <li>Údaje byly nezákonně zpracovávány</li>
              <li>Smazání vyžaduje právní předpis</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.4 Právo na omezení zpracování (čl. 18 GDPR)</h3>
            <p>Můžete požádat o omezení zpracování, pokud sporujete přesnost údajů nebo zákonnost zpracování.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.5 Právo na přenositelnost (čl. 20 GDPR)</h3>
            <p>Máte právo získat své osobní údaje ve strukturovaném, běžně používaném a strojově čitelném formátu.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.6 Právo vznést námitku (čl. 21 GDPR)</h3>
            <p>Můžete námitkou nesouhlasit se zpracováním založeným na oprávněném zájmu nebo pro účely přímého marketingu.</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">7.7 Právo odvolat souhlas (čl. 7 odst. 3 GDPR)</h3>
            <p>Souhlas můžete kdykoli odvolat, aniž by to ovlivnilo zákonnost zpracování před odvoláním.</p>

            <p className="mt-4 bg-slate-800 border border-slate-600 p-4 rounded-lg text-slate-200">
              <strong>Uplatnění práv:</strong> Všechna práva můžete uplatnit e-mailem na adrese <a href="mailto:tadeas@raska.eu" className="text-primary hover:underline">tadeas@raska.eu</a> nebo prostřednictvím uživatelského účtu. Na vaši žádost odpovíme do 30 dnů.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Zabezpečení osobních údajů</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">8.1 Technická opatření</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Šifrování dat při přenosu (TLS 1.3) i v klidu (AES-256)</li>
              <li>Silná autentizace a autorizace přístupů</li>
              <li>Pravidelné bezpečnostní audity a penetrační testy</li>
              <li>Monitoring bezpečnostních incidentů 24/7</li>
              <li>Pravidelné zálohy s testováním obnovy</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">8.2 Organizační opatření</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Školení zaměstnanců v oblasti ochrany osobních údajů</li>
              <li>Principe nejmenších nutných oprávnění</li>
              <li>Písemné smlouvy se všemi zpracovateli</li>
              <li>Plán řešení bezpečnostních incidentů</li>
              <li>Pravidelné aktualizace bezpečnostních politik</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">8.3 Narušení bezpečnosti údajů</h3>
            <p>
              V případě narušení bezpečnosti údajů s rizikem pro práva a svobody fyzických osob oznámíme incident dozorového úřadu do 72 hodin a dotčeným osobám bez zbytečného odkladu.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Doba nezletilých</h2>
            <p>
              Naše služba není určena pro osoby mladší 16 let. Nevědomě neshromažďujeme osobní údaje od dětí mladších 16 let. Pokud zjistíme, že jsme získali osobní údaje dítěte mladšího 16 let bez ověřitelného souhlasu rodičů, takové údaje smažeme.
            </p>
            <p className="mt-2">
              Rodičům doporučujeme, aby sledovali online aktivity svých dětí a pomohli jim pochopit naše zásady ochrany soukromí.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Posouzení vlivu na ochranu údajů (DPIA)</h2>
            <p>
              Pro zpracování osobních údajů prostřednictvím AI systémů jsme provedli posouzení vlivu na ochranu osobních údajů podle čl. 35 GDPR. Výsledek posouzení potvrdil, že naše zpracování představuje přijatelné riziko pro práva a svobody subjektů údajů.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Cookies a podobné technologie</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-3">11.1 Typy cookies</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Nezbytné cookies:</strong> Technicky nutné pro fungování webu (vždy aktivní)</li>
              <li><strong>Funkční cookies:</strong> Ukládání preferencí a nastavení (se souhlasem)</li>
              <li><strong>Analytické cookies:</strong> Google Analytics pro analýzu návštěvnosti (se souhlasem)</li>
              <li><strong>Marketingové cookies:</strong> Sledování pro účely reklamy (se souhlasem)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-3">11.2 Správa cookies</h3>
            <p>
              Souhlas s cookies můžete upravit v nastavení prohlížeče nebo pomocí našeho nástroje pro správu cookies na webových stránkách.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Změny zásad</h2>
            <p>
              Tyto zásady můžeme aktualizovat v případě změn právních předpisů, našich služeb nebo způsobů zpracování údajů. O podstatných změnách vás budeme informovat e-mailem nejméně 30 dní předem.
            </p>
            <p className="mt-2">
              Doporučujeme tyto zásady pravidelně kontrolovat na naší webové stránce.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Stížnosti a dozorový orgán</h2>
            <p>
              Máte právo podat stížnost u dozorového orgánu, pokud se domníváte, že zpracování vašich osobních údajů porušuje GDPR:
            </p>
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-lg mt-2">
              <p className="text-slate-200"><strong>Úřad pro ochranu osobních údajů</strong></p>
              <p className="text-slate-300">Pplk. Sochora 27, 170 00 Praha 7</p>
              <p className="text-slate-300">Tel.: +420 234 665 111</p>
              <p className="text-slate-300">E-mail: <a href="mailto:posta@uoou.cz" className="text-primary hover:underline">posta@uoou.cz</a></p>
              <p className="text-slate-300">Web: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.uoou.cz</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Kontakt</h2>
            <p>
              Pro jakékoli dotazy týkající se zpracování osobních údajů nás kontaktujte:
            </p>
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-lg mt-2">
              <p className="text-slate-200"><strong>HaulGO s.r.o.</strong></p>
              <p className="text-slate-300">E-mail: <a href="mailto:tadeas@raska.eu" className="text-primary hover:underline">tadeas@raska.eu</a></p>
              <p className="text-slate-300">Poštovní adresa: Mládí 4024/15A, Mšeno nad Nisou, 466 04 Jablonec nad Nisou</p>
              <p className="text-slate-300">Předmět e-mailu označte: "GDPR dotaz" pro rychlejší vyřízení</p>
            </div>
            <p className="mt-4">
              <strong>Doba vyřízení:</strong> Na vaše dotazy odpovíme do 30 dnů od obdržení, v složitějších případech do 60 dnů s odůvodněním prodloužení lhůty.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Účinnost</h2>
            <p>
              Tyto zásady nabývají účinnosti dne 7. 8. 2025 a nahrazují všechny předchozí verze.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Verze dokumentu:</strong> 2.0 | <strong>Poslední revize:</strong> 7. 8. 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}