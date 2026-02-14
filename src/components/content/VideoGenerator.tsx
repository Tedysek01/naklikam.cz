import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Download, Sparkles, Video, AlertCircle, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { generatedContentService } from '@/services/generatedContentService'
import { storageService } from '@/services/storageService'

type VideoType = 'promo' | 'social-reel' | 'intro' | 'product' | 'testimonial' | 'custom'
type VideoQuality = 'fast' | 'quality'

interface VideoOption {
  id: VideoType
  label: string
  placeholder: string
  fastCredits: number
  qualityCredits: number
}

const videoOptions: VideoOption[] = [
  { id: 'promo', label: 'Promo video', placeholder: 'Např: Představení cukrárny', fastCredits: 29, qualityCredits: 144 },
  { id: 'social-reel', label: 'FB/IG Reels', placeholder: 'Např: Rychlý recept na dort', fastCredits: 29, qualityCredits: 144 },
  { id: 'intro', label: 'Intro animace', placeholder: 'Např: Logo animace', fastCredits: 29, qualityCredits: 144 },
  { id: 'product', label: 'Produktové video', placeholder: 'Např: 360° prezentace dortu', fastCredits: 29, qualityCredits: 144 },
  { id: 'testimonial', label: 'Reference zákazníků', placeholder: 'Např: Spokojení zákazníci', fastCredits: 29, qualityCredits: 144 },
  { id: 'custom', label: '🎯 Vlastní prompt', placeholder: 'Napište vlastní zadání...', fastCredits: 29, qualityCredits: 144 }
]

const qualityOptions = [
  { id: 'fast', label: 'Fast (8s)', description: 'Rychlejší generování, nižší cena', credits: 29 },
  { id: 'quality', label: 'Quality (8s)', description: 'Vyšší kvalita, více času', credits: 144 }
]

export default function VideoGenerator() {
  const [selectedType, setSelectedType] = useState<VideoType>('promo')
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('fast')
  const [description, setDescription] = useState('')
  const [script, setScript] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedVideo, setGeneratedVideo] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  const user = useAuthStore(state => state.user)

  const selectedOption = videoOptions.find(opt => opt.id === selectedType)!
  const finalCredits = selectedQuality === 'fast' ? selectedOption.fastCredits : selectedOption.qualityCredits
  const userCredits = user?.subscription?.credits || 0

  const handleGenerate = async () => {
    if (selectedType === 'custom') {
      if (!customPrompt) {
        toast({
          title: "Chyba",
          description: "Vyplňte prosím vlastní prompt",
          variant: "destructive"
        })
        return
      }
    } else {
      if (!description) {
        toast({
          title: "Chyba",
          description: "Vyplňte prosím popis videa",
          variant: "destructive"
        })
        return
      }
    }

    if (userCredits < finalCredits) {
      toast({
        title: "Nedostatek kreditů",
        description: `Pro tuto akci potřebujete ${finalCredits} kreditů. Máte pouze ${userCredits}.`,
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 2000)

    try {
      const response = await fetch('/api/content/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          quality: selectedQuality,
          description,
          script,
          customPrompt: selectedType === 'custom' ? customPrompt : undefined,
          userId: user?.uid
        })
      })

      if (!response.ok) throw new Error('Failed to generate video')

      const data = await response.json()
      setGeneratedVideo(data.videoUrl)
      setProgress(100)
      
      // Update user credits locally (should be done server-side)
      if (user?.subscription && user.subscription.credits) {
        user.subscription.credits -= finalCredits
      }

      toast({
        title: "Video vygenerováno!",
        description: data.message || `Použito ${finalCredits} kreditů`
      })
    } catch (error: any) {
      let title = "Chyba"
      let description = "Nepodařilo se vygenerovat video. Zkuste to prosím znovu."
      
      // Handle timeout specifically
      if (error.response?.status === 408) {
        const data = error.response.data
        title = "Timeout"
        description = data.message || "Generování trvalo příliš dlouho. Kredity nebyly strženy."
        
        // Don't deduct credits on timeout
        if (user?.subscription && data.creditsRefunded) {
          // Credits were not deducted, no need to adjust
        }
      } else {
        // Check if credits were refunded on other errors
        try {
          const errorData = error.response?.data
          if (errorData?.creditsRefunded && user?.subscription) {
            // Credits were refunded, no need to adjust local state
            description = errorData.message || description
          }
        } catch (parseError) {
          // Ignore parsing errors
        }
      }

      toast({
        title,
        description,
        variant: "destructive"
      })
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = generatedVideo
    link.download = `${selectedType}-${Date.now()}.mp4`
    link.click()
  }

  const handleSave = async () => {
    if (!user || !generatedVideo) return
    
    setIsSaving(true)
    try {
      const title = `${selectedOption.label} - ${description || 'Vlastní video'}`
      const contentId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Upload video to Firebase Storage with progress tracking
      const uploadedVideoUrl = await storageService.uploadVideoFromUrl(
        user.id, 
        contentId, 
        generatedVideo,
        `${selectedType}_${Date.now()}.mp4`
      )
      
      const prompt = selectedType === 'custom' ? {
        custom: customPrompt,
        quality: selectedQuality
      } : {
        original: description,
        additionalInfo: script,
        quality: selectedQuality
      }

      await generatedContentService.saveContent({
        userId: user.id,
        type: 'video',
        subType: selectedType,
        title: title.slice(0, 100),
        content: uploadedVideoUrl, // Firebase Storage URL
        prompt,
        metadata: {
          credits: finalCredits,
          contentLength: 8 // seconds
        },
        settings: {
          canEdit: false,
          canDownload: true,
          canShare: true
        }
      })

      toast({
        title: "Video uloženo",
        description: "Video bylo úspěšně uloženo do Firebase Storage a historie"
      })
    } catch (error) {
      console.error('Error saving video:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit video. Zkuste to prosím znovu.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left side - Generator Form */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
          <div className="flex items-center gap-3 text-white mb-4">
            <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Generátor videí</h2>
              <p className="text-purple-200 text-sm">
                Vytvořte profesionální videa pomocí AI (Gemini Veo 3)
              </p>
            </div>
          </div>
          
          {/* Premium notice */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-purple-400 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-white">Prémiová funkce</p>
                <p className="text-slate-300 text-sm mt-1">
                  Generování videí pomocí Veo 3 je unikátní funkce v ČR. 
                  Videa spotřebují více kreditů kvůli výpočetní náročnosti.
                </p>
              </div>
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Typ videa</label>
            <div className="grid grid-cols-1 gap-2">
              {videoOptions.map(option => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedType === option.id 
                      ? 'border-purple-400 bg-purple-900/50' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedType(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{option.label}</span>
                    <span className="text-purple-300 text-sm font-semibold">
                      {selectedQuality === 'fast' ? option.fastCredits : option.qualityCredits}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Kvalita videa</label>
            <div className="grid grid-cols-2 gap-3">
              {qualityOptions.map(option => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedQuality === option.id 
                      ? 'border-purple-400 bg-purple-900/50' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedQuality(option.id as VideoQuality)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{option.label}</span>
                    <span className="text-sm text-purple-300 font-semibold">{option.credits}k</span>
                  </div>
                  <p className="text-xs text-slate-400">{option.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Popis videa *
            </label>
            <Input
              placeholder={selectedOption.placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>

          {/* Script/scenario */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Scénář / Text (volitelné)
            </label>
            <Textarea
              placeholder="Např: Úvodní záběr na cukrárnu, pak detail dortu, závěr s logem..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>

          {/* Custom prompt field - show only when custom type is selected */}
          {selectedType === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Vlastní prompt *
              </label>
              <Textarea
                placeholder="Napište své vlastní zadání pro AI..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-400"
              />
              
              {/* Prompt examples */}
              <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-600/30 mt-3">
                <h4 className="text-sm font-medium text-white mb-2">💡 Příklady dobrých promptů:</h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Kinematografické video promo kavárny. Začíná záběrem z venku oknem, pak plynulý pohyb dov nitř, detail přípravy kávy, úsměv baristu, závěr s logem. Teplé barvy, 8 sekund.')}>
                    <strong>Promo:</strong> "Kinematografické video promo kavárny. Začíná záběrem z venku oknem, pak plynulý pohyb dov nitř, detail přípravy kávy, úsměv baristu, závěr s logem. Teplé barvy, 8 sekund."
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Rychlé Instagram Reel ukazující přípravu dortu. Quick cuts: smíchání, pékání, zdobení, finální výsledek. Energické tempo, živé barvy, trendy ústyle, 8 sekund.')}>
                    <strong>Social:</strong> "Rychlé Instagram Reel ukazující přípravu dortu. Quick cuts: smíchání, pékání, zdobení, finální výsledek. Energické tempo, živé barvy, trendy ústyle, 8 sekund."
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Elegantní animované intro s logem firmy. Logo se plynule objeví ze středu, přidá se text, pak celé se rozjasní. Minimal design, čisté pozadí, profesionální působení, 5 sekund.')}>
                    <strong>Intro:</strong> "Elegantní animované intro s logem firmy. Logo se plynule objeví ze středu, přidá se text, pak celé se rozjasní. Minimal design, čisté pozadí, profesionální působení, 5 sekund."
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>Tip:</strong> Popište scénář, kamerové pohyby, barvy, náladu a délku videa.
                </p>
              </div>
            </div>
          )}
          {/* Credits info */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm text-white">
                Tato akce spotřebuje <strong>{finalCredits} kreditů</strong>
              </span>
            </div>
            <span className="text-sm font-semibold text-purple-300">
              Zbývá: {userCredits} kreditů
            </span>
          </div>

          {/* Generate button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || userCredits < finalCredits}
            className="w-full bg-gradient-to-r from-naklikam-pink-500 to-naklikam-pink-600 hover:from-naklikam-pink-600 hover:to-naklikam-pink-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generuji video... {progress}%
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Vygenerovat video
              </>
            )}
          </Button>

          {/* Progress bar */}
          {isGenerating && (
            <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
              <div 
                className="bg-gradient-to-r from-naklikam-pink-500 to-naklikam-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right side - Generated Video */}
      <div className="lg:sticky lg:top-6">
        {generatedVideo ? (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
                  <Video className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Vygenerované video</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="mr-1 animate-spin" />
                      Ukládání...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-1" />
                      Uložit
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  <Download size={16} className="mr-1" />
                  Stáhnout
                </Button>
              </div>
            </div>
            <video 
              controls 
              className="w-full rounded-lg border border-slate-600/50"
              src={generatedVideo}
            >
              Váš prohlížeč nepodporuje přehrávání videí.
            </video>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <Video className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Náhled videa</h3>
            </div>
            <div className="aspect-video bg-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center">
              <div className="text-center">
                <Video className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Zde se zobrazí vaše vygenerované video</p>
                <p className="text-slate-500 text-xs mt-1">Vyplňte formulář vlevo a klikněte na generovat</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}