import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ContentGenerator from '../../utils/contentGenerator';
import Pricing from '@/components/Pricing';

// Import data
import urlsData from '../../data/generated-urls.json';
import templatesData from '../../data/content-templates.json';

interface SeoPageData {
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  structuredData: any;
  type: string;
}

const ProgrammaticSeoPage: React.FC = () => {
  const { '*': wildcardPath } = useParams();
  const location = window.location.pathname;
  const [pageData, setPageData] = useState<SeoPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPageContent = async () => {
      console.log('Loading page content for:', location);
      console.log('Wildcard path:', wildcardPath);
      console.log('URLs data length:', urlsData.length);
      
      if (!location || location === '/') {
        console.log('No URL path provided');
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Find matching URL in our generated URLs
      const matchingUrl = urlsData.find((url: any) => 
        url.path === location
      );

      console.log('Matching URL found:', matchingUrl);

      if (!matchingUrl) {
        console.log('No matching URL found for:', location);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const contentGenerator = new ContentGenerator(templatesData);
      let generatedContent: any = null;

      try {
        switch (matchingUrl.type) {
          case 'profession-city-landing':
            if (matchingUrl.profession && matchingUrl.city) {
              generatedContent = contentGenerator.generateProfessionCityPage(
                matchingUrl.profession,
                matchingUrl.city
              );
            }
            break;

          case 'city-landing':
            if (matchingUrl.city) {
              generatedContent = contentGenerator.generateCityPage(matchingUrl.city);
            }
            break;

          case 'profession-template':
            if (matchingUrl.profession) {
              generatedContent = contentGenerator.generateProfessionTemplate(
                matchingUrl.profession
              );
            }
            break;

          case 'profession-examples':
            if (matchingUrl.profession) {
              generatedContent = contentGenerator.generateProfessionTemplate(
                matchingUrl.profession
              );
            }
            break;

          case 'how-to-guide':
            if (matchingUrl.profession) {
              generatedContent = contentGenerator.generateHowToGuide(
                matchingUrl.profession
              );
            }
            break;

          case 'competitor-comparison':
            if (matchingUrl.competitor) {
              generatedContent = contentGenerator.generateCompetitorPage(
                matchingUrl.competitor
              );
            }
            break;

          default:
            setNotFound(true);
            setLoading(false);
            return;
        }

        if (generatedContent) {
          setPageData({
            ...generatedContent,
            type: matchingUrl.type
          });
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error generating content:', error);
        setNotFound(true);
      }

      setLoading(false);
    };

    loadPageContent();
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (notFound || !pageData) {
    return <Navigate to="/404" replace />;
  }

  const renderMarkdownContent = (content: string) => {
    // Simple markdown parser for our content
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Handle headers
        if (paragraph.startsWith('# ')) {
          return (
            <h1 key={index} className="text-4xl font-bold text-gray-900 mb-6">
              {paragraph.substring(2)}
            </h1>
          );
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h2 key={index} className="text-3xl font-semibold text-gray-800 mb-4 mt-8">
              {paragraph.substring(3)}
            </h2>
          );
        }
        if (paragraph.startsWith('### ')) {
          return (
            <h3 key={index} className="text-2xl font-semibold text-gray-700 mb-3 mt-6">
              {paragraph.substring(4)}
            </h3>
          );
        }

        // Handle lists
        if (paragraph.includes('- ')) {
          const items = paragraph.split('\n').filter(line => line.startsWith('- '));
          return (
            <ul key={index} className="list-disc list-inside space-y-2 mb-4">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-700">
                  {item.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                </li>
              ))}
            </ul>
          );
        }

        // Handle numbered lists
        if (/^\d+\. /.test(paragraph)) {
          const items = paragraph.split('\n').filter(line => /^\d+\. /.test(line));
          return (
            <ol key={index} className="list-decimal list-inside space-y-2 mb-4">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-700">
                  {item.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                </li>
              ))}
            </ol>
          );
        }

        // Handle CTAs (links)
        if (paragraph.includes('[')) {
          const linkMatch = paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            return (
              <div key={index} className="text-center my-8">
                <a
                  href={linkMatch[2]}
                  className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-200"
                >
                  {linkMatch[1]}
                </a>
              </div>
            );
          }
        }

        // Regular paragraphs
        return (
          <p key={index} className="text-gray-700 mb-4 leading-relaxed">
            {paragraph
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
            }
          </p>
        );
      });
  };

  return (
    <>
      <Helmet>
        <title>{pageData.title}</title>
        <meta name="description" content={pageData.metaDescription} />
        <meta property="og:title" content={pageData.title} />
        <meta property="og:description" content={pageData.metaDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://naklikam.cz${location}`} />
        <script type="application/ld+json">
          {JSON.stringify(pageData.structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center space-x-2">
                <img src="/naklikam-logo.svg" alt="Naklikám.cz" className="h-8" />
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
            <div className="prose max-w-none">
              {renderMarkdownContent(pageData.content)}
            </div>
          </article>

          {/* Related links */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Možná vás zajímá</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <a href="/templates" className="block p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">Šablony webů</h3>
                <p className="text-gray-600 text-sm mt-1">Hotové designy pro všechny profese</p>
              </a>
              <a href="/examples" className="block p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">Příklady webů</h3>
                <p className="text-gray-600 text-sm mt-1">Inspirace z úspěšných projektů</p>
              </a>
              <a href="/pricing" className="block p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">Ceník</h3>
                <p className="text-gray-600 text-sm mt-1">Transparentní ceny od 580 Kč</p>
              </a>
            </div>
          </div>
        </main>

        {/* Pricing Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <Pricing />
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Naklikám.cz</h3>
                <p className="text-gray-400 text-sm">
                  Vytvářejte webové aplikace pomocí AI, aniž byste psali kód.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Produkty</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/templates" className="text-gray-400 hover:text-white">Šablony</a></li>
                  <li><a href="/examples" className="text-gray-400 hover:text-white">Příklady</a></li>
                  <li><a href="/pricing" className="text-gray-400 hover:text-white">Ceník</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Podpora</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/help" className="text-gray-400 hover:text-white">Nápověda</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white">Kontakt</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Společnost</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/about" className="text-gray-400 hover:text-white">O nás</a></li>
                  <li><a href="/privacy" className="text-gray-400 hover:text-white">Ochrana soukromí</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
              © 2025 HaulGO s.r.o. Všechna práva vyhrazena.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProgrammaticSeoPage;