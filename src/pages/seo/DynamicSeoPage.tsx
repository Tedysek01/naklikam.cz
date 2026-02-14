import React from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const DynamicSeoPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Parse URL to extract profession and city
  const getPageData = (path: string) => {
    // Default data
    let profession = 'truhlář';
    let city = 'Praha';
    let pageType = 'profession-city';
    let title = 'Web pro truhlář Praha | Naklikám.cz';
    let description = 'Vytvořte si profesionální web pro truhlář v Praha za 10 minut s AI. Bez programování, za 580 Kč/měsíc.';

    // Parse different URL patterns
    if (path.includes('/web-pro-')) {
      const match = path.match(/\/web-pro-([^-]+)-(.+)/);
      if (match) {
        profession = match[1];
        city = match[2];
        title = `Web pro ${profession} ${city} | Naklikám.cz`;
        description = `Vytvořte si profesionální web pro ${profession} v ${city} za 10 minut s AI. Bez programování, za 580 Kč/měsíc.`;
      }
    } else if (path.includes('/tvorba-webu-')) {
      const match = path.match(/\/tvorba-webu-(.+)/);
      if (match) {
        city = match[1];
        pageType = 'city';
        title = `Tvorba webu ${city} | AI web za 10 minut`;
        description = `Profesionální tvorba webu v ${city} s AI. Bez programování, za 580 Kč/měsíc.`;
      }
    } else if (path.includes('/templates/')) {
      const match = path.match(/\/templates\/(.+)/);
      if (match) {
        profession = match[1];
        pageType = 'template';
        title = `Šablona webu pro ${profession} | Hotové templaty`;
        description = `Hotová šablona webu pro ${profession}. Profesionální design, naklikejte si za 5 minut!`;
      }
    } else if (path.includes('/examples/')) {
      const match = path.match(/\/examples\/(.+)/);
      if (match) {
        profession = match[1];
        pageType = 'examples';
        title = `Příklady webů pro ${profession} | Inspirace`;
        description = `Prohlédněte si příklady úspěšných webů pro ${profession}. Najděte inspiraci pro váš web.`;
      }
    }

    return { profession, city, pageType, title, description };
  };

  const { profession, city, pageType, title, description } = getPageData(path);

  const renderContent = () => {
    switch (pageType) {
      case 'city':
        return (
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Tvorba webu {city} | AI web za 10 minut
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Profesionální tvorba webu v {city} s umělou inteligencí
            </p>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Proč podnikatelé v {city} volí Naklikám.cz?
            </h2>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>🚀 Hotovo za 10 minut</strong> - Nejrychlejší způsob jak mít web</li>
              <li><strong>💰 Jen 580 Kč/měsíc</strong> - Místo 50 000 Kč za programátora</li>
              <li><strong>🇨🇿 100% česky</strong> - Podpora i obsah v češtině</li>
              <li><strong>📱 Responzivní design</strong> - Funguje na všech zařízeních</li>
            </ul>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Nejoblíbenější weby v {city}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Autoservisy</h3>
                <p className="text-gray-600 text-sm">Rezervace termínů, ceník služeb</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Kadeřnictví</h3>
                <p className="text-gray-600 text-sm">Galerie účesů, online rezervace</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Restaurace</h3>
                <p className="text-gray-600 text-sm">Menu, rezervace stolů</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Truhlářství</h3>
                <p className="text-gray-600 text-sm">Portfolio prací, kontakt</p>
              </div>
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Šablona webu pro {profession} | Hotové templaty
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Profesionální šablona optimalizovaná pro {profession}
            </p>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Co obsahuje šablona pro {profession}?
            </h2>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>✅ Profesionální design</li>
              <li>✅ Responzivní layout</li>
              <li>✅ SEO optimalizace</li>
              <li>✅ Kontaktní formulář</li>
              <li>✅ Galerie prací</li>
              <li>✅ Ceník služeb</li>
            </ul>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-2">Speciálně pro {profession}</h3>
              <p className="text-gray-700">
                Tato šablona je navržena speciálně pro potřeby {profession}ů. 
                Obsahuje všechny důležité sekce a je připravena k okamžitému použití.
              </p>
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Příklady webů pro {profession} | Inspirace a ukázky
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Inspirujte se úspěšnými weby pro {profession}
            </p>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Úspěšné weby pro {profession}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  <span className="text-gray-500">Ukázka webu #{profession} 1</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">Moderní design pro {profession}</h3>
                  <p className="text-gray-600 text-sm">Čistý a profesionální vzhled</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  <span className="text-gray-500">Ukázka webu #{profession} 2</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">Minimalistický web {profession}</h3>
                  <p className="text-gray-600 text-sm">Zaměření na obsah a funkcionalitu</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Příběhy úspěchu
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-semibold">Pavel ({profession}): "Za měsíc jsem měl o 40% více zákazníků"</p>
                <p className="text-gray-700 text-sm mt-1">
                  Díky profesionálnímu webu získal Pavel důvěru zákazníků a zvýšil své tržby.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">Marie ({profession}): "Konečně nemusím čekat na programátora"</p>
                <p className="text-gray-700 text-sm mt-1">
                  Marie si web upravuje sama podle potřeby a ušetří tisíce korun.
                </p>
              </div>
            </div>
          </div>
        );

      default: // profession-city
        return (
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Web pro {profession} {city} | Naklikám.cz
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Naklikejte si profesionální web pro {profession} v {city} za 10 minut
            </p>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Proč si vybrat Naklikám.cz pro {profession} v {city}?
            </h2>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>🚀 Hotovo za 10 minut</strong> - Řeknete AI co chcete, ona to nakliká</li>
              <li><strong>💰 Jen 580 Kč/měsíc</strong> - Místo 50 000 Kč za programátora</li>
              <li><strong>🇨🇿 100% česky</strong> - Podpora, obsah i platby v korunách</li>
              <li><strong>📱 Funguje všude</strong> - Na mobilu, tabletu i počítači</li>
              <li><strong>🛠️ Měníte co chcete</strong> - Bez závislosti na technicích</li>
            </ul>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              {profession} v {city} - fakta
            </h2>
            
            <p className="text-gray-700 mb-6">
              V {city} působí stovky {profession}ů. Získejte náskok před konkurencí 
              s profesionálním webem vytvořeným za 10 minut!
            </p>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Web přesně pro {profession}
            </h2>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>✅ Galerie prací a referencí</li>
              <li>✅ Ceník služeb</li>
              <li>✅ Kontaktní údaje</li>
              <li>✅ Online rezervace</li>
              <li>✅ SEO optimalizace</li>
            </ul>

            <div className="text-center my-8">
              <a
                href="/auth"
                className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-200"
              >
                Začít zdarma
              </a>
            </div>

            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Jak to funguje?
            </h2>

            <ol className="list-decimal list-inside space-y-2 mb-6">
              <li><strong>Popíšete:</strong> 'Chci web pro {profession} v {city}'</li>
              <li><strong>AI vytvoří:</strong> Profesionální web za 10 minut</li>
              <li><strong>Upravíte:</strong> Jednoduše česky - 'Změň barvu na modrou'</li>
              <li><strong>Publikujete:</strong> Jedním klikem jde web online</li>
            </ol>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://naklikam.cz${path}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Naklikám.cz
                </span>
              </a>
              <nav className="hidden md:flex space-x-8">
                <a href="/pricing" className="text-gray-600 hover:text-gray-900">Ceník</a>
                <a href="/templates" className="text-gray-600 hover:text-gray-900">Šablony</a>
                <a href="/examples" className="text-gray-600 hover:text-gray-900">Příklady</a>
                <a href="/auth" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg">
                  Začít zdarma
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          <article className="bg-white rounded-xl shadow-lg p-8">
            {renderContent()}

            <div className="mt-8 pt-8 border-t">
              <h2 className="text-2xl font-semibold mb-4">Často kladené dotazy</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Jak dlouho trvá vytvořit web?</h3>
                  <p className="text-gray-700">S AI to zvládnete za 10-15 minut. Stačí popsat co chcete a AI vše nakliká za vás.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Kolik to stojí?</h3>
                  <p className="text-gray-700">Jen 580 Kč/měsíc místo 50 000 Kč za programátora. Můžete začít zdarma.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Funguje to i bez technických znalostí?</h3>
                  <p className="text-gray-700">Ano! Mluvíte s AI česky jako s člověkem. Žádné programování nebo technické znalosti nejsou potřeba.</p>
                </div>
              </div>

              <div className="text-center mt-8">
                <a
                  href="/auth"
                  className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-200"
                >
                  Začít zdarma
                </a>
              </div>
            </div>
          </article>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-4">
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Naklikám.cz
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 HaulGO s.r.o. Všechna práva vyhrazena.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DynamicSeoPage;