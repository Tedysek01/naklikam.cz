import { Crown, ArrowRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useNavigate } from 'react-router-dom'

interface UpgradePromptProps {
  feature: 'deployment' | 'github' | 'code_view' | 'code_download'
  message: string
  className?: string
}

export default function UpgradePrompt({ feature, message, className }: UpgradePromptProps) {
  const navigate = useNavigate()

  // Different benefits for different features
  const benefits = feature === 'code_view' || feature === 'code_download' ? [
    '📝 Zobrazení a editace kódu',
    '💾 Stažení projektů jako ZIP',
    '🎨 Plný přístup k souborům',
    '🚀 2M tokenů měsíčně',
    '⚡ Rychlejší generování',
    '🛠️ Pokročilé funkce'
  ] : [
    '🚀 Automatický deployment na Vercel',
    '💾 GitHub integrace a sync',
    '🔧 Vytváření nových repozitářů',
    '🌐 Live URL pro sdílení',
    '⚡ Prioritní generování',
    '💬 Chat podpora'
  ]

  const isCodeFeature = feature === 'code_view' || feature === 'code_download'

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upgrade Card */}
      <Card className="bg-gradient-to-br from-naklikam-pink-500/15 via-naklikam-purple-500/15 to-naklikam-pink-500/15 border-naklikam-pink-500/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-naklikam-pink-300">
            <Crown className="w-5 h-5" />
            Upgrade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-naklikam-pink-200 mb-4">
            {message}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-naklikam-pink-200">
                <div className="w-1.5 h-1.5 bg-naklikam-pink-400 rounded-full flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate('/subscription')}
              className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              className="border-naklikam-pink-400 text-naklikam-pink-300 hover:bg-naklikam-pink-500/10"
              onClick={() => navigate('/subscription')}
            >
              Porovnat plány
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trial Plan Features */}
      {isCodeFeature ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Download className="w-5 h-5" />
              Trial plán (79 Kč)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                Zobrazení a editace kódu
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                Export projektů jako ZIP
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                100 000 tokenů (~2-3 generace)
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                Testování všech funkcí
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Download className="w-5 h-5" />
              Dostupné ve Pro plánu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                Export kompletního kódu projektu
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                Stažení všech souborů jako ZIP
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                Lokální preview v prohlížeči
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                2M tokenů měsíčně (~100 AI generací)
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}