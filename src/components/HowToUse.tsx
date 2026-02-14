interface HowToUseProps {
  videoId: string;
}

export function HowToUse({ videoId }: HowToUseProps) {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Nadpis */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Jak na to? Zvládne to každý!
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Za 6 minut se naučíte vytvořit svůj první web. Od registrace přes napsání promptu až po úpravu barev a nahrání obrázků. 
              <span className="font-semibold text-naklikam-pink-500"> Žádné technické znalosti nejsou potřeba!</span>
            </p>
          </div>

          {/* Co se naučíte */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="text-naklikam-pink-500 font-semibold mb-1">🚀 Start (0:00)</div>
              <div className="text-sm text-muted-foreground">Rychlá registrace a první přihlášení</div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="text-naklikam-pink-500 font-semibold mb-1">✨ Vytvoření (1:30)</div>
              <div className="text-sm text-muted-foreground">Jak napsat prompt a vytvořit první projekt</div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="text-naklikam-pink-500 font-semibold mb-1">🎨 Úpravy (3:00)</div>
              <div className="text-sm text-muted-foreground">Změna textů, barev a nahrání obrázků</div>
            </div>
          </div>

          {/* Video */}
          <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
            <div 
              className="aspect-video"
              dangerouslySetInnerHTML={{
                __html: `
                  <iframe 
                    width="100%" 
                    height="100%"
                    src="https://www.youtube.com/embed/${videoId}"
                    title="Jak začít s Naklikam.cz - návod pro začátečníky"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                    style="width: 100%; height: 100%;"
                  ></iframe>
                `
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}