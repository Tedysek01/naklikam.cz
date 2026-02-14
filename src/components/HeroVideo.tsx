import { VideoPlayer } from './VideoPlayer';

export function HeroVideo() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="bg-card rounded-xl shadow-2xl overflow-hidden border border-border">
        <div className="p-6 bg-gradient-to-r from-naklikam-pink-500 to-naklikam-purple-600">
          <h2 className="text-2xl font-bold text-white">
            Podívejte se, jak Naklikam.cz funguje
          </h2>
          <p className="text-white/90 mt-2">
            6 minut, které změní váš pohled na tvorbu webů
          </p>
        </div>
        
        {/* YouTube verze - DOPORUČENO */}
        <VideoPlayer
          src="https://www.youtube.com/watch?v=YOUR_VIDEO_ID" 
          provider="youtube"
          className="w-full"
        />
        
        {/* Nebo Cloudflare Stream verze 
        <VideoPlayer
          src="YOUR_CLOUDFLARE_VIDEO_ID" 
          provider="cloudflare"
          className="w-full"
        />
        */}
        
        {/* Nebo self-hosted verze s CDN
        <VideoPlayer
          src="https://cdn.naklikam.cz/videos/demo-6min.mp4" 
          poster="https://cdn.naklikam.cz/videos/demo-poster.jpg"
          provider="direct"
          className="w-full"
        />
        */}
      </div>
    </div>
  );
}