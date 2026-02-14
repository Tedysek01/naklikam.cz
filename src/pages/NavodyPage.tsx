import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Logo from '@/components/ui/logo';
import { UserMenu } from '@/components/UserMenu';
import { useAuthStore } from '@/store/authStore';

interface VideoGuide {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'začátečník' | 'pokročilý' | 'tipy';
  icon: React.ReactNode;
  youtubeId: string;
  tags: string[];
}

const videoGuides: VideoGuide[] = [
  {
    id: '1',
    title: 'Jak začít s Naklikam.cz',
    description: 'Kompletní návod pro začátečníky - od registrace po první web',
    duration: '6:00',
    category: 'začátečník',
    icon: <Sparkles className="w-5 h-5" />,
    youtubeId: 'gmfjw2yeb1o',
    tags: ['registrace', 'první projekt', 'základy']
  },
  {
    id: '2',
    title: 'Jak opravovat errory a chyby',
    description: 'Návod na řešení 3 různých chyb při zobrazování náhledu vygenerovaného webu',
    duration: '1:45',
    category: 'pokročilý',
    icon: <AlertCircle className="w-5 h-5" />,
    youtubeId: '2nNejKyGtNE',
    tags: ['chyby', 'debugging', 'náhled', 'opravy']
  }
];

export default function NavodyPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedVideo, setSelectedVideo] = useState<VideoGuide | null>(null);

  const filteredGuides = videoGuides;

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'začátečník': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pokročilý': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tipy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            aria-label="Zpět na hlavní stránku"
          >
            <Logo />
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-naklikam-pink-500" />
              <span className="text-lg font-semibold">Návody</span>
            </div>
          </button>
          <div className="flex items-center gap-4">
            {isAuthenticated && <UserMenu />}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero sekce */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Video návody pro Naklikam.cz
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Naučte se vytvářet profesionální weby bez znalosti programování. 
            Všechny návody jsou v češtině a krok za krokem.
          </p>
        </div>


        {/* Video modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
            <div className="bg-card rounded-xl max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                >
                  ✕
                </Button>
              </div>
              <div 
                className="aspect-video"
                dangerouslySetInnerHTML={{
                  __html: `
                    <iframe 
                      width="100%" 
                      height="100%"
                      src="https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1"
                      title="${selectedVideo.title}"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerpolicy="strict-origin-when-cross-origin"
                      allowfullscreen
                      style="width: 100%; height: 100%; border-bottom-left-radius: 0.75rem; border-bottom-right-radius: 0.75rem;"
                    ></iframe>
                  `
                }}
              />
            </div>
          </div>
        )}

        {/* Grid s návody */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <Card 
              key={guide.id}
              className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => setSelectedVideo(guide)}
            >
              {/* Video thumbnail */}
              <div className="relative aspect-video bg-muted">
                <img 
                  src={`https://img.youtube.com/vi/${guide.youtubeId}/maxresdefault.jpg`}
                  alt={guide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${guide.youtubeId}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white rounded-full p-4">
                    <Play className="w-8 h-8 text-naklikam-pink-500 fill-current" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(guide.category)}`}>
                    {guide.category}
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {guide.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="text-naklikam-pink-500 mt-1">
                    {guide.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-naklikam-pink-500 transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {guide.description}
                    </p>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {guide.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Prázdný stav */}
        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Žádné návody v této kategorii
            </p>
          </div>
        )}

        {/* CTA sekce */}
        <div className="mt-16 text-center bg-gradient-to-r from-naklikam-pink-500/10 to-naklikam-purple-600/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Potřebujete další pomoc?</h2>
          <p className="text-muted-foreground mb-6">
            Pokud jste nenašli odpověď na svou otázku, neváhejte nás kontaktovat
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/contact')}>
              Kontaktovat podporu
            </Button>
            <Button variant="outline" onClick={() => window.open('https://discord.gg/naklikam', '_blank')}>
              Připojit se na Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}