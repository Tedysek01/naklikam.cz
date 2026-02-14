import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-8">Všeobecné obchodní podmínky</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">
            Účinné od: 7. 8. 2025 | Verze: 2.0
          </p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Základní ustanovení</h2>
            <p>
              1.1. Tyto všeobecné obchodní podmínky (dále jen „VOP") upravují v souladu s ustanovením § 1751 odst. 1 zákona č. 89/2012 Sb., občanský zákoník (dále jen „občanský zákoník") vzájemná práva a povinnosti smluvních stran vzniklé v souvislosti nebo na základě smlouvy o poskytování služeb (dále jen „smlouva") uzavírané mezi společností HaulGO s.r.o., IČO: 21290661, se sídlem Mládí 4024/15A, Mšeno nad Nisou, 466 04 Jablonec nad Nisou, zapsanou v obchodním rejstříku vedeném Krajským soudem v Ústí nad Labem, oddíl C, vložka 50831 (dále jen „poskytovatel") a fyzickou či právnickou osobou (dále jen „uživatel").
            </p>
            <p>
              1.2. Ustanovení odchylná od VOP je možné sjednat ve smlouvě. Odchylná ujednání ve smlouvě mají přednost před ustanoveními VOP.
            </p>
            <p>
              1.3. Ustanovení VOP jsou nedílnou součástí smlouvy. Smlouva a VOP jsou vyhotoveny v českém jazyce.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Vymezení pojmů</h2>
            <p>Pro účely těchto VOP se rozumí:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Službou</strong> – cloudová SaaS platforma Naklikam.cz využívající umělou inteligenci pro generování webových aplikací a projektů</li>
              <li><strong>Digitálním obsahem</strong> – data vytvářená a poskytovaná v digitální podobě ve smyslu § 1791a občanského zákoníku, zejména vygenerovaný zdrojový kód, návrhy aplikací a další výstupy AI</li>
              <li><strong>Uživatelským účtem</strong> – účet zřízený na základě registrace umožňující přístup ke Službě</li>
              <li><strong>Spotřebitelem</strong> – fyzická osoba, která při uzavírání a plnění smlouvy nejedná v rámci své podnikatelské činnosti nebo v rámci samostatného výkonu svého povolání</li>
              <li><strong>Podnikatelem</strong> – osoba zapsaná v obchodním rejstříku nebo osoba podnikající na základě živnostenského oprávnění či jiného oprávnění</li>
              <li><strong>AI systémem</strong> – systém umělé inteligence ve smyslu čl. 3 odst. 1 nařízení (EU) 2024/1689 (AI Act)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Uzavření smlouvy</h2>
            <p>
              3.1. Smlouva je uzavřena okamžikem, kdy uživatel dokončí registraci kliknutím na tlačítko „Registrovat se" po vyplnění registračního formuláře a zaškrtnutí souhlasu s těmito VOP. Tímto okamžikem vzniká mezi poskytovatelem a uživatelem smluvní vztah.
            </p>
            <p>
              3.2. Před odesláním registrace je uživateli umožněno zkontrolovat a měnit údaje, které do registrace vložil. Údaje uvedené uživatelem při registraci jsou poskytovatelem považovány za správné.
            </p>
            <p>
              3.3. Poskytovatel neprodleně po uzavření smlouvy zašle uživateli potvrzení o uzavření smlouvy na e-mailovou adresu uvedenou při registraci, včetně těchto VOP ve smyslu § 1824a občanského zákoníku.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cena a platební podmínky</h2>
            <p>
              4.1. Ceny za poskytování Služby jsou uvedeny na webových stránkách poskytovatele. Všechny ceny jsou uvedeny včetně DPH v zákonné výši.
            </p>
            <p>
              4.2. Platby za Službu jsou zpracovávány prostřednictvím platební brány Stripe. Platební podmínky se řídí obchodními podmínkami společnosti Stripe.
            </p>
            <p>
              4.3. Daňový doklad – fakturu vystaví poskytovatel uživateli po uhrazení ceny a zašle jej v elektronické podobě na e-mailovou adresu uživatele.
            </p>
            <p>
              4.4. V případě prodlení s úhradou je poskytovatel oprávněn pozastavit poskytování Služby podle § 1912 občanského zákoníku.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Odstoupení od smlouvy</h2>
            <p>
              5.1. <strong>Spotřebitel bere na vědomí, že podle § 1837 písm. l) občanského zákoníku nemůže odstoupit od smlouvy o dodání digitálního obsahu, který není dodán na hmotném nosiči, bylo-li plnění započato s jeho předchozím výslovným souhlasem před uplynutím lhůty pro odstoupení od smlouvy a poskytovatel před uzavřením smlouvy sdělil spotřebiteli, že v takovém případě nemá právo na odstoupení od smlouvy.</strong>
            </p>
            <p>
              5.2. Registrací a zaškrtnutím souhlasu spotřebitel výslovně žádá o okamžité započetí poskytování Služby a bere na vědomí, že tímto ztrácí právo na odstoupení od smlouvy podle § 1829 občanského zákoníku.
            </p>
            <p>
              5.3. Poskytovatel poskytne spotřebiteli potvrzení podle § 1824a a § 1840 občanského zákoníku obsahující:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Informaci o ztrátě práva na odstoupení</li>
              <li>Výslovný souhlas s okamžitým započetím plnění</li>
              <li>Potvrzení o uzavření smlouvy</li>
            </ul>
            <p>
              5.4. Vzhledem k okamžitému zpřístupnění digitálního obsahu a AI nástrojů není možné vrácení platby (refundace) po aktivaci služby.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Práva a povinnosti stran</h2>
            <p>
              6.1. <strong>Poskytovatel se zavazuje:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Poskytovat Službu v souladu s právními předpisy a těmito VOP</li>
              <li>Zajistit funkčnost Služby s výhradou plánované údržby a okolností vylučujících odpovědnost</li>
              <li>Informovat uživatele o podstatných změnách Služby</li>
              <li>Zajistit ochranu osobních údajů podle GDPR a souvisejících předpisů</li>
            </ul>
            
            <p className="mt-4">
              6.2. <strong>Uživatel se zavazuje:</strong>
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Užívat Službu v souladu s právními předpisy, dobrými mravy a těmito VOP</li>
              <li>Nezneužívat AI systém k vytváření nezákonného, škodlivého nebo zavádějícího obsahu</li>
              <li>Respektovat práva duševního vlastnictví třetích osob</li>
              <li>Nesdílet přístupové údaje s třetími osobami</li>
              <li>Neprovádět reverse engineering, dekompilaci nebo jiné pokusy o získání zdrojového kódu Služby</li>
            </ul>

            <p className="mt-4">
              6.3. <strong>Zakázané použití podle AI Act:</strong>
            </p>
            <p>
              V souladu s nařízením (EU) 2024/1689 je zakázáno používat Službu k:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Podprahovým technikám ovlivňování chování</li>
              <li>Zneužívání zranitelnosti osob (děti, senioři, osoby se zdravotním postižením)</li>
              <li>Vytváření systémů sociálního skórování</li>
              <li>Biometrické identifikaci v reálném čase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Duševní vlastnictví a licence</h2>
            <p>
              7.1. Veškerý obsah vytvořený uživatelem pomocí Služby (vygenerovaný kód, návrhy) je vlastnictvím uživatele, s výhradou práv třetích osob.
            </p>
            <p>
              7.2. Uživatel uděluje poskytovateli nevýhradní, celosvětovou, bezúplatnou licenci k užití vytvořeného obsahu výhradně pro účely:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Technického zpracování a zobrazení v rámci Služby</li>
              <li>Vytváření anonymizovaných statistik a analýz</li>
              <li>Zlepšování AI modelů (pouze s anonymizovanými daty)</li>
            </ul>
            <p>
              7.3. Služba samotná, včetně softwaru, designu a know-how, je chráněna autorským právem poskytovatele podle zákona č. 121/2000 Sb., autorský zákon.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Odpovědnost za vady a omezení odpovědnosti</h2>
            <p>
              8.1. Poskytovatel odpovídá za to, že Služba má vlastnosti výslovně uvedené v popisu Služby.
            </p>
            <p>
              8.2. Vzhledem k povaze AI systémů poskytovatel negarantuje:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Bezchybnost nebo úplnou správnost vygenerovaného kódu</li>
              <li>Vhodnost výstupů pro konkrétní účel uživatele</li>
              <li>Nepřetržitou dostupnost Služby</li>
              <li>Kompatibilitu s všemi systémy a zařízeními</li>
            </ul>
            <p>
              8.3. Poskytovatel nenese odpovědnost za:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Škody způsobené použitím vygenerovaného obsahu</li>
              <li>Ztrátu dat způsobenou vyšší mocí nebo jednáním uživatele</li>
              <li>Škody vzniklé porušením těchto VOP uživatelem</li>
              <li>Nepřímé nebo následné škody</li>
            </ul>
            <p>
              8.4. Celková odpovědnost poskytovatele za škodu je omezena částkou uhrazenou uživatelem za Službu v posledních 12 měsících.
            </p>
            <p>
              8.5. Služba je aktuálně poskytována v beta verzi, což může znamenat občasné technické potíže, nedostupnost některých funkcí nebo omezený výkon systému.
            </p>
            <p>
              8.6. Uživatel je povinen uplatnit práva z vadného plnění bez zbytečného odkladu podle § 1921 občanského zákoníku.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Automatizované rozhodování a AI transparentnost</h2>
            <p>
              9.1. V souladu s čl. 22 GDPR a čl. 13 AI Act poskytovatel informuje, že:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Služba využívá AI systém pro generování kódu, který není plně automatizovaným rozhodováním s právními účinky</li>
              <li>Veškeré výstupy AI jsou pouze návrhy, konečné rozhodnutí o jejich použití činí uživatel</li>
              <li>AI systém je založen na modelech Claude (Anthropic) s následujícími omezeními: možné nepřesnosti, omezená znalost aktuálních událostí, nemožnost přístupu k externím zdrojům v reálném čase</li>
            </ul>
            <p>
              9.2. Uživatel má právo:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Požádat o lidskou intervenci při řešení problémů</li>
              <li>Vyjádřit svůj názor na fungování AI systému</li>
              <li>Získat vysvětlení logiky AI zpracování v obecné rovině</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Doba trvání a ukončení smlouvy</h2>
            <p>
              10.1. Smlouva se uzavírá na dobu neurčitou.
            </p>
            <p>
              10.2. Uživatel může smlouvu vypovědět kdykoliv prostřednictvím uživatelského účtu nebo písemným oznámením. Výpověď je účinná ke konci aktuálního zúčtovacího období.
            </p>
            <p>
              10.3. Poskytovatel může smlouvu vypovědět s měsíční výpovědní dobou, nebo okamžitě při podstatném porušení VOP uživatelem podle § 2002 občanského zákoníku.
            </p>
            <p>
              10.4. Po ukončení smlouvy má uživatel 30 dní na stažení svých dat. Po této lhůtě mohou být data smazána.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Ochrana osobních údajů</h2>
            <p>
              11.1. Zpracování osobních údajů se řídí Zásadami ochrany osobních údajů dostupnými na <a href="/privacy" className="text-primary hover:underline">www.naklikam.cz/privacy</a>.
            </p>
            <p>
              11.2. Poskytovatel je správcem osobních údajů podle čl. 4 bod 7 GDPR.
            </p>
            <p>
              11.3. Dozorový orgán: Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, www.uoou.cz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Doručování</h2>
            <p>
              12.1. Smluvní strany si mohou veškerou písemnou korespondenci doručovat prostřednictvím elektronické pošty.
            </p>
            <p>
              12.2. Zpráva je doručena okamžikem jejího přijetí na server příchozí pošty podle § 570 občanského zákoníku.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Mimosoudní řešení sporů</h2>
            <p>
              13.1. K mimosoudnímu řešení spotřebitelských sporů je příslušná Česká obchodní inspekce, se sídlem Štěpánská 567/15, 120 00 Praha 2, IČ: 000 20 869, internetová adresa: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.coi.cz</a>.
            </p>
            <p>
              13.2. Platformu pro řešení sporů on-line nacházející se na internetové adrese <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ec.europa.eu/consumers/odr</a> je možné využít při řešení sporů mezi poskytovatelem a spotřebitelem z kupní smlouvy uzavřené prostředky komunikace na dálku.
            </p>
            <p>
              13.3. Evropské spotřebitelské centrum Česká republika, se sídlem Štěpánská 567/15, 120 00 Praha 2, internetová adresa: <a href="https://www.evropskyspotrebitel.cz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.evropskyspotrebitel.cz</a> je kontaktním místem podle Nařízení Evropského parlamentu a Rady (EU) č. 524/2013 ze dne 21. května 2013 o řešení spotřebitelských sporů on-line.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Závěrečná ustanovení</h2>
            <p>
              14.1. Vztahy neupravené těmito VOP se řídí občanským zákoníkem, zákonem č. 634/1992 Sb., o ochraně spotřebitele, GDPR, AI Act a dalšími příslušnými právními předpisy.
            </p>
            <p>
              14.2. Je-li některé ustanovení VOP neplatné nebo neúčinné, nebo se takovým stane, namísto neplatných ustanovení nastoupí ustanovení, jehož smysl se neplatnému ustanovení co nejvíce přibližuje. Neplatností nebo neúčinností jednoho ustanovení není dotčena platnost ostatních ustanovení.
            </p>
            <p>
              14.3. Poskytovatel si vyhrazuje právo změnit nebo doplnit znění VOP. O změně bude uživatel informován e-mailem nejméně 30 dní předem.
            </p>
            <p>
              14.4. Veškeré spory budou přednostně řešeny smírnou cestou. Nepodaří-li se spor vyřešit smírně, budou spory rozhodovány příslušnými soudy České republiky.
            </p>
            <p>
              14.5. Kontaktní údaje poskytovatele: HaulGO s.r.o., Mládí 4024/15A, Mšeno nad Nisou, 466 04 Jablonec nad Nisou, e-mail: tadeas@raska.eu, tel.: uvedeno na webových stránkách.
            </p>
            <p>
              14.6. Tyto VOP nabývají účinnosti dne 7. 8. 2025.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}