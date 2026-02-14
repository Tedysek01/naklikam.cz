import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { User, LogOut } from 'lucide-react'
import Logo from '@/components/ui/logo'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import CTA from '@/components/CTA'
import LandingChatBox from '@/components/LandingChatBox'
import { useAuthStore } from '@/store/authStore'

// Inline UI Components (copied from HomePage)
const Button = ({ children, onClick, className = '', variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors ${
      variant === 'outline' ? 'border border-pink-500/50 bg-transparent text-pink-400 hover:bg-pink-500/10 hover:border-pink-500' :
      variant === 'ghost' ? 'text-pink-300 hover:bg-pink-500/10' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

// Helper functions for Czech grammar
const getCityNameWithCase = (citySlug: string): string => {
  const cityMap: Record<string, string> = {
    // Největší města
    'praha': 'Praha',
    'brno': 'Brno', 
    'ostrava': 'Ostrava',
    'plzen': 'Plzeň',
    'liberec': 'Liberec',
    'olomouc': 'Olomouc',
    // Krajská města
    'ceske-budejovice': 'České Budějovice',
    'hradec-kralove': 'Hradec Králové',
    'usti-nad-labem': 'Ústí nad Labem',
    'pardubice': 'Pardubice',
    'zlin': 'Zlín',
    'karlovy-vary': 'Karlovy Vary',
    'jihlava': 'Jihlava',
    // Střední města
    'havirov': 'Havířov',
    'kladno': 'Kladno',
    'most': 'Most',
    'karvina': 'Karviná',
    'frydek-mistek': 'Frýdek-Místek',
    'opava': 'Opava',
    'decin': 'Děčín',
    'teplice': 'Teplice',
    'jablonec-nad-nisou': 'Jablonec nad Nisou',
    'mlada-boleslav': 'Mladá Boleslav',
    'prostejov': 'Prostějov',
    'prerov': 'Přerov',
    'ceska-lipa': 'Česká Lípa',
    'trebic': 'Třebíč',
    'trinec': 'Třinec',
    'tabor': 'Tábor',
    'znojmo': 'Znojmo',
    'pribram': 'Příbram',
    'cheb': 'Cheb',
    'trutnov': 'Trutnov',
    'orlova': 'Orlová',
    'chomutov': 'Chomutov',
    'pisek': 'Písek',
    'otrokovice': 'Otrokovice',
    'koprivnice': 'Kopřivnice',
    'hodonin': 'Hodonín',
    'cesky-tesin': 'Český Těšín',
    'hranice': 'Hranice',
    'sokolov': 'Sokolov',
    'kolin': 'Kolín',
    'breclav': 'Břeclav',
    'nachod': 'Náchod',
    'novy-jicin': 'Nový Jičín',
    'svitavy': 'Svitavy',
    'strakonice': 'Strakonice',
    'vsetin': 'Vsetín',
    'zdar-nad-sazavou': 'Žďár nad Sázavou',
    'litvinov': 'Litvínov',
    // Menší města
    'benesov': 'Benešov',
    'beroun': 'Beroun',
    'brandys-nad-labem': 'Brandýs nad Labem',
    'cernosice': 'Černošice',
    'ricany': 'Říčany',
    'caslav': 'Čáslav',
    'nymburk': 'Nymburk',
    'podebrady': 'Poděbrady',
    'slany': 'Slaný',
    'kralupy-nad-vltavou': 'Kralupy nad Vltavou',
    'melnik': 'Mělník',
    'neratovice': 'Neratovice',
    'lysa-nad-labem': 'Lysá nad Labem',
    'celakovice': 'Čelákovice',
    'unhost': 'Unhošť',
    'hostivice': 'Hostivice',
    'rudna': 'Rudná',
    'jesenice': 'Jesenice',
    'brandys-nad-labem-stara-boleslav': 'Brandýs nad Labem-Stará Boleslav'
  };
  return cityMap[citySlug] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
};

// Helper function to get profession name from slug
const getProfessionName = (professionSlug: string): string => {
  const professionMap: Record<string, string> = {
    'truhlar': 'truhlář',
    'kadernik': 'kadeřník',
    'kadeřnice': 'kadeřnice',
    'autoservis': 'autoservis',
    'masaž': 'masér',
    'autoopravna': 'autoopravna',
    'elektrikař': 'elektrikář',
    'instalater': 'instalatér',
    'malir': 'malíř',
    'zahradnik': 'zahradník',
    'stavba': 'stavebník',
    'cleaning': 'úklidová služba',
    'fotograf': 'fotograf',
    'účetni': 'účetní',
    'advokat': 'advokát',
    'zubař': 'zubař',
    'veterinar': 'veterinář',
    'realitni': 'realitní makléř',
    'fitness': 'fitness trenér',
    'joga': 'jóga instruktor'
  };
  return professionMap[professionSlug] || professionSlug;
};

// Helper function to get profession in accusative case (4. pád)
const getProfessionAccusative = (professionSlug: string): string => {
  const accusativeMap: Record<string, string> = {
    'truhlar': 'truhláře',
    'kadernik': 'kadeřníka', 
    'kadeřnice': 'kadeřnici',
    'autoservis': 'autoservis',
    'masaž': 'maséra',
    'autoopravna': 'autoopravnu',
    'elektrikař': 'elektrikáře',
    'instalater': 'instalatéra',
    'malir': 'malíře',
    'zahradnik': 'zahradníka',
    'stavba': 'stavebníka',
    'cleaning': 'úklidovou službu',
    'fotograf': 'fotografa',
    'účetni': 'účetního',
    'advokat': 'advokáta',
    'zubař': 'zubaře',
    'veterinar': 'veterináře',
    'realitni': 'realitního makléře',
    'fitness': 'fitness trenéra',
    'joga': 'jóga instruktora'
  };
  return accusativeMap[professionSlug] || getProfessionName(professionSlug);
};

const getCityInLocative = (citySlug: string): string => {
  const locativeMap: Record<string, string> = {
    // Největší města
    'praha': 'Praze',
    'brno': 'Brně', 
    'ostrava': 'Ostravě',
    'plzen': 'Plzni',
    'liberec': 'Liberci',
    'olomouc': 'Olomouci',
    
    // Krajská města
    'ceske-budejovice': 'Českých Budějovicích',
    'hradec-kralove': 'Hradci Králové',
    'usti-nad-labem': 'Ústí nad Labem',
    'pardubice': 'Pardubicích',
    'zlin': 'Zlíně',
    'karlovy-vary': 'Karlových Varech',
    'jihlava': 'Jihlavě',
    
    // Střední města
    'havirov': 'Havířově',
    'kladno': 'Kladně',
    'most': 'Mostě',
    'karvina': 'Karviné',
    'frydek-mistek': 'Frýdku-Místku',
    'opava': 'Opavě',
    'decin': 'Děčíně',
    'teplice': 'Teplicích',
    'jablonec-nad-nisou': 'Jablonci nad Nisou',
    'mlada-boleslav': 'Mladé Boleslavi',
    'prostejov': 'Prostějově',
    'prerov': 'Přerově',
    'ceska-lipa': 'České Lípě',
    'trebic': 'Třebíči',
    'trinec': 'Třinci',
    'tabor': 'Táboře',
    'znojmo': 'Znojmě',
    'pribram': 'Příbrami',
    'cheb': 'Chebu',
    'trutnov': 'Trutnově',
    'orlova': 'Orlové',
    'chomutov': 'Chomutově',
    'otrokovice': 'Otrokovicích',
    'hranice': 'Hranicích',
    'pisek': 'Písku',
    'kromeriz': 'Kroměříži',
    'vsetin': 'Vsetíně',
    'valasske-mezirici': 'Valašském Meziříčí',
    'uherske-hradiste': 'Uherském Hradišti',
    'litvinov': 'Litvínově',
    'kolin': 'Kolíně',
    'kutna-hora': 'Kutné Hoře',
    'hodonin': 'Hodoníně',
    'blansko': 'Blansku',
    'ostrov': 'Ostrově',
    'sokolov': 'Sokolově',
    'beroun': 'Berouně',
    'brandys-nad-labem': 'Brandýse nad Labem',
    'klatovy': 'Klatovech',
    'novy-jicin': 'Novém Jičíně',
    'rokycany': 'Rokycanech',
    'strakonice': 'Strakonicích',
    'rychnov-nad-kneznou': 'Rychnově nad Kněžnou',
    'jindrichuv-hradec': 'Jindřichově Hradci',
    'nachod': 'Náchodě',
    'susice': 'Sušici',
    'vimperk': 'Vimperku',
    'domazlice': 'Domažlicích',
    'horazďovice': 'Horažďovicích',
    'prachatice': 'Prachaticích',
    'cernosice': 'Černošicích',
    // Další města ze seznamu
    'ricany': 'Říčanech',
    'caslav': 'Čáslavi',
    'podebrady': 'Poděbradech',
    'slany': 'Slaném',
    'kralupy-nad-vltavou': 'Kralupech nad Vltavou',
    'melnik': 'Mělníku',
    'neratovice': 'Neratovicích',
    'lysa-nad-labem': 'Lysé nad Labem',
    'celakovice': 'Čelákovicích',
    'unhost': 'Unhošti',
    'hostivice': 'Hostivici',
    'rudna': 'Rudné',
    'jesenice': 'Jesenici',
    'brandys-nad-labem-stara-boleslav': 'Brandýse nad Labem-Staré Boleslavi',
    'zdar-nad-sazavou': 'Žďáru nad Sázavou',
    'breclav': 'Břeclavi',
    'svitavy': 'Svitavách'
  };
  return locativeMap[citySlug] || getCityNameWithCase(citySlug);
};

export default function LandingBasedSeoPage() {
  const location = useLocation()
  const path = location.pathname
  const { user, isAuthenticated, logout, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  const handleLogout = async () => {
    await logout()
  }

  // Parse URL to extract profession and city
  const getPageData = (path: string) => {
    let profession = 'truhlář';
    let city = 'Praha';
    let pageType = 'profession-city';
    let title = 'Web pro truhláře v Praze | Naklikám.cz';
    let description = 'Vytvořte si profesionální web pro truhláře v Praze za 10 minut s AI. Bez programování, za 580 Kč/měsíc.';
    let heroTitle = 'Vytvořte si web pro truhláře v Praze';
    let heroSubtitle = 'jen chatováním s AI';
    let heroDescription = 'Popište česky co potřebujete a AI vám vygeneruje kompletní funkční web pro truhláře v Praze.';

    // Parse different URL patterns
    if (path.includes('/web-pro-')) {
      const match = path.match(/\/web-pro-([^-]+)-(.+)/);
      if (match) {
        const professionSlug = match[1];
        const citySlug = match[2];
        profession = getProfessionName(professionSlug);
        const professionAccusative = getProfessionAccusative(professionSlug);
        city = getCityNameWithCase(citySlug);
        const cityLocative = getCityInLocative(citySlug);
        title = `Web pro ${professionAccusative} v ${cityLocative} | Naklikám.cz`;
        description = `Vytvořte si profesionální web pro ${professionAccusative} v ${cityLocative} za 10 minut s AI. Bez programování, za 580 Kč/měsíc.`;
        heroTitle = `Vytvořte si web pro ${professionAccusative} v ${cityLocative}`;
        heroSubtitle = 'jen chatováním s AI';
        heroDescription = `Popište česky co potřebujete a AI vám vygeneruje kompletní funkční web pro ${professionAccusative} v ${cityLocative}.`;
      }
    } else if (path.includes('/tvorba-webu-')) {
      const match = path.match(/\/tvorba-webu-(.+)/);
      if (match) {
        const citySlug = match[1];
        city = getCityNameWithCase(citySlug);
        const cityLocative = getCityInLocative(citySlug);
        pageType = 'city';
        title = `Tvorba webu ${city} | AI web za 10 minut`;
        description = `Profesionální tvorba webu v ${cityLocative} s AI. Bez programování, za 580 Kč/měsíc.`;
        heroTitle = `Tvorba webu v ${cityLocative}`;
        heroSubtitle = 'jen chatováním s AI';
        heroDescription = `Popište česky co potřebujete a AI vám vygeneruje kompletní funkční web. Speciálně pro podnikatele v ${cityLocative}.`;
      }
    } else if (path.includes('/templates/')) {
      const match = path.match(/\/templates\/(.+)/);
      if (match) {
        const professionSlug = match[1];
        profession = getProfessionName(professionSlug);
        const professionAccusative = getProfessionAccusative(professionSlug);
        pageType = 'template';
        title = `Šablona webu pro ${professionAccusative} | Hotové templaty`;
        description = `Hotová šablona webu pro ${professionAccusative}. Profesionální design, naklikejte si za 5 minut!`;
        heroTitle = `Šablona webu pro ${professionAccusative}`;
        heroSubtitle = 'hotová za 5 minut';
        heroDescription = `Profesionální šablona optimalizovaná speciálně pro ${professionAccusative}. Stačí kliknout a upravit.`;
      }
    } else if (path.includes('/examples/')) {
      const match = path.match(/\/examples\/(.+)/);
      if (match) {
        const professionSlug = match[1];
        profession = getProfessionName(professionSlug);
        const professionAccusative = getProfessionAccusative(professionSlug);
        pageType = 'examples';
        title = `Příklady webů pro ${professionAccusative} | Inspirace`;
        description = `Prohlédněte si příklady úspěšných webů pro ${professionAccusative}. Najděte inspiraci pro váš web.`;
        heroTitle = `Příklady webů pro ${professionAccusative}`;
        heroSubtitle = 'a inspirace pro váš web';
        heroDescription = `Prohlédněte si galerii úspěšných webů pro ${professionAccusative} a nechte se inspirovat.`;
      }
    }

    return { profession, city, pageType, title, description, heroTitle, heroSubtitle, heroDescription };
  };

  const { city, pageType, title, description, heroTitle, heroSubtitle, heroDescription } = getPageData(path);

  // Custom chat placeholder based on page type
  const getChatPlaceholder = () => {
    switch (pageType) {
      case 'city':
        const cityLocativeForPlaceholder = getCityInLocative(path.split('/tvorba-webu-')[1] || 'praha');
        return `Např: "Chci web pro můj salon v ${cityLocativeForPlaceholder} s rezervačním systémem"`;
      case 'template':
        const professionSlugForTemplate = path.split('/templates/')[1] || 'truhlar';
        const professionAccusativeForTemplate = getProfessionAccusative(professionSlugForTemplate);
        return `Např: "Použij šablonu pro ${professionAccusativeForTemplate} a změň barvy na modrou"`;
      case 'examples':
        const professionSlugForExamples = path.split('/examples/')[1] || 'truhlar';
        const professionAccusativeForExamples = getProfessionAccusative(professionSlugForExamples);
        return `Např: "Vytvoř podobný web jako ten první příklad pro ${professionAccusativeForExamples}"`;
      default:
        const professionSlugDefault = path.split('/web-pro-')[1]?.split('-')[0] || 'truhlar';
        const professionAccusativeDefault = getProfessionAccusative(professionSlugDefault);
        const citySlugDefault = path.split('/web-pro-')[1]?.split('-')[1] || 'praha';
        const cityLocativeDefault = getCityInLocative(citySlugDefault);
        return `Např: "Chci web pro ${professionAccusativeDefault} v ${cityLocativeDefault} s galerií prací a ceníkem"`;
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": pageType === 'city' ? "Organization" : "LocalBusiness",
            "name": title,
            "description": description,
            "url": `https://naklikam.cz${path}`,
            ...(pageType !== 'city' && {
              "address": {
                "@type": "PostalAddress",
                "addressLocality": city,
                "addressCountry": "CZ"
              },
              "serviceArea": city,
              "priceRange": "580 Kč/měsíc"
            })
          })}
        </script>
      </Helmet>

      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background - same as HomePage */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] md:w-[120%] h-[600px] md:h-[800px] opacity-60">
            <div className="absolute inset-0 bg-gradient-to-b from-naklikam-purple-500/20 via-naklikam-pink-500/30 to-transparent blur-2xl md:blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-40">
            <div className="absolute inset-0 bg-gradient-radial from-naklikam-pink-500/40 to-transparent blur-2xl md:blur-3xl"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] opacity-40">
            <div className="absolute inset-0 bg-gradient-radial from-naklikam-purple-500/40 to-transparent blur-2xl md:blur-3xl"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <nav className="grid grid-cols-3 items-center p-4 md:p-6">
            {/* Logo - Left */}
            <div className="flex items-center justify-self-start">
              <Link to="/">
                <Logo size="lg" />
              </Link>
            </div>
            
            {/* Navigation Menu - Center */}
            <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8">
              <a href="/#jak-to-funguje" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
                Jak to funguje
              </a>
              <a href="/#cenik" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
                Ceník
              </a>
              <a href="/#faq" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
                FAQ
              </a>
              <a href="/#kontakt" className="text-foreground/80 hover:text-foreground transition-colors text-sm lg:text-base">
                Kontakt
              </a>
            </div>
            
            {/* Auth Buttons - Right */}
            <div className="flex items-center space-x-2 md:space-x-4 justify-self-end">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center space-x-2 text-sm">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden md:block text-foreground">{user.name}</span>
                    {user.subscription && (
                      <span className="text-xs bg-naklikam-gradient text-white px-2 py-1 rounded-full">
                        {user.subscription.plan}
                      </span>
                    )}
                  </div>
                  <Link to="/dashboard">
                    <Button variant="outline" className="text-sm md:text-base px-3 md:px-4">
                      <User className="h-4 w-4 mr-1" />
                      Projekty
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="text-sm md:text-base px-3 md:px-4"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Odhlásit
                  </Button>
                </>
              ) : (
                <>
                  <Link to={`/auth?returnTo=${encodeURIComponent(path)}`}>
                    <Button variant="outline" className="text-sm md:text-base px-3 md:px-4">Přihlásit se</Button>
                  </Link>
                  <Link to={`/auth?returnTo=${encodeURIComponent(path)}`}>
                    <Button className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-sm md:text-base px-3 md:px-4">
                      Registrace
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Hero Section - Full Height */}
          <main className="h-[calc(100vh-80px)] flex flex-col">
            {/* Centered Hero Content */}
            <div className="flex-1 flex items-center justify-center px-4 md:px-6">
              <div className="text-center max-w-6xl mx-auto w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display text-foreground mb-6">
                  <span className="block sm:inline">{heroTitle}</span>
                  <span className="bg-naklikam-gradient bg-clip-text text-transparent"> {heroSubtitle}</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-12 md:mb-16 px-4 md:px-0 max-w-3xl mx-auto">
                  {heroDescription}<br className="hidden md:block" />
                  <span className="text-base md:text-lg opacity-80">Bez programování, bez složitých nástrojů, bez čekání na programátora.</span>
                </p>
                
                {/* Interactive Chat Box - Using actual LandingChatBox component */}
                <div className="mb-8">
                  <LandingChatBox placeholder={getChatPlaceholder()} />
                </div>

                {/* Local benefits - specific to page type */}
                <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-sm">
                  {pageType === 'city' && (
                    <>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🏙️</div>
                        <p className="text-foreground font-medium">Lokální podpora v {getCityInLocative(path.split('/tvorba-webu-')[1] || 'praha')}</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🚀</div>
                        <p className="text-foreground font-medium">Web za 10 minut</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">💰</div>
                        <p className="text-foreground font-medium">Od 580 Kč/měsíc</p>
                      </div>
                    </>
                  )}
                  {pageType === 'template' && (
                    <>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📋</div>
                        <p className="text-foreground font-medium">Hotová šablona pro {getProfessionAccusative(path.split('/templates/')[1] || 'truhlar')}</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">⚡</div>
                        <p className="text-foreground font-medium">Připraveno za 5 minut</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎨</div>
                        <p className="text-foreground font-medium">Profesionální design</p>
                      </div>
                    </>
                  )}
                  {(pageType === 'profession-city' || pageType === 'examples') && (
                    <>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎯</div>
                        <p className="text-foreground font-medium">Přesně pro {pageType === 'profession-city' ? getProfessionAccusative(path.split('/web-pro-')[1]?.split('-')[0] || 'truhlar') : getProfessionAccusative(path.split('/examples/')[1] || 'truhlar')}</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🇨🇿</div>
                        <p className="text-foreground font-medium">100% česky</p>
                      </div>
                      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 group">
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">✅</div>
                        <p className="text-foreground font-medium">Bez programování</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Content Sections - same as HomePage */}
          <div className="container mx-auto px-4 md:px-6 pb-8 md:pb-12">
            <HowItWorks />
            <Pricing />
            <FAQ />
            <CTA />
          </div>
        </div>
      </div>
    </>
  )
}