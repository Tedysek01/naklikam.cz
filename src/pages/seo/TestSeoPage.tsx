import React from 'react';
import { Helmet } from 'react-helmet-async';
import Pricing from '@/components/Pricing';

const TestSeoPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Test SEO Page - Web pro truhlář Praha</title>
        <meta name="description" content="Test stránka pro programmatic SEO systém Naklikam.cz" />
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
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Web pro truhlář Praha | Naklikám.cz
            </h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Naklikejte si profesionální web pro truhlář v Praha za 10 minut
            </p>

            <div className="prose max-w-none">
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Proč si vybrat Naklikám.cz pro truhlář v Praha?
              </h2>

              <ul className="list-disc list-inside space-y-2 mb-6">
                <li><strong>🚀 Hotovo za 10 minut</strong> - Řeknete AI co chcete, ona to nakliká</li>
                <li><strong>💰 Jen 580 Kč/měsíc</strong> - Místo 50 000 Kč za programátora</li>
                <li><strong>🇨🇿 100% česky</strong> - Podpora, obsah i platby v korunách</li>
                <li><strong>📱 Funguje všude</strong> - Na mobilu, tabletu i počítači</li>
                <li><strong>🛠️ Měníte co chcete</strong> - Bez závislosti na technicích</li>
              </ul>

              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Truhlář v Praha - fakta
              </h2>
              
              <p className="text-gray-700 mb-6">
                V Praha (1309000 obyvatel, Praha) působí stovky truhlářů. Pouze 393 z nich má kvalitní web. 
                Získejte náskok před konkurencí!
              </p>

              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Web přesně pro truhlář
              </h2>

              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>✅ galerie prací</li>
                <li>✅ cenník služeb</li>
                <li>✅ kontakt</li>
                <li>✅ reference</li>
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
                <li><strong>Popíšete:</strong> 'Chci web pro truhlář v Praha'</li>
                <li><strong>AI vytvoří:</strong> Profesionální web za 10 minut</li>
                <li><strong>Upravíte:</strong> Jednoduše česky - 'Změň barvu na modrou'</li>
                <li><strong>Publikujete:</strong> Jedním klikem jde web online</li>
              </ol>

              <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                Často kladené dotazy
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Jak dlouho trvá vytvořit web pro truhlář?</h3>
                  <p className="text-gray-700">S AI to zvládnete za 10-15 minut. Stačí popsat co chcete a AI vše nakliká za vás.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Kolik to stojí ve srovnání s programátorem v Praha?</h3>
                  <p className="text-gray-700">Průměrná cena webu od programátora v Praha je 15000 Kč. U nás zaplatíte jen 580 Kč/měsíc.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">Může web fungovat i pro truhlář bez technických znalostí?</h3>
                  <p className="text-gray-700">Ano! Navrhli jsme Naklikám.cz přesně pro lidi bez technických znalostí. Mluvíte s AI česky jako s člověkem.</p>
                </div>
              </div>
            </div>
          </article>
        </main>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <Pricing />
          </div>
        </section>

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

export default TestSeoPage;