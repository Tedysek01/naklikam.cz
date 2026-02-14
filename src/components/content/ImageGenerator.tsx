import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Download, Sparkles, Image as ImageIcon, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { generatedContentService } from '@/services/generatedContentService'
import { storageService } from '@/services/storageService'

type ImageType = 'hero' | 'icon' | 'banner' | 'product' | 'infographic' | 'custom'
type ImageStyle = 'realistic' | 'illustration' | 'minimal' | 'vintage' | 'modern'

interface ImageOption {
  id: ImageType
  label: string
  placeholder: string
  credits: number
  dimensions: string
}

const imageOptions: ImageOption[] = [
  { id: 'hero', label: 'Hero obrázek', placeholder: 'Např: Útulná kavárna s výhledem', credits: 3, dimensions: '1920x1080' },
  { id: 'icon', label: 'Ikony služeb', placeholder: 'Např: Ikona dortu', credits: 3, dimensions: '512x512' },
  { id: 'banner', label: 'Banner na sítě', placeholder: 'Např: Vánoční sleva banner', credits: 3, dimensions: '1200x630' },
  { id: 'product', label: 'Produktová fotka', placeholder: 'Např: Čokoládový dort', credits: 3, dimensions: '1024x1024' },
  { id: 'infographic', label: 'Infografika', placeholder: 'Např: Proces výroby dortu', credits: 3, dimensions: '1080x1920' },
  { id: 'custom', label: '🎯 Vlastní prompt', placeholder: 'Napište vlastní zadání...', credits: 3, dimensions: '1024x1024' }
]

const styleOptions = [
  { id: 'realistic', label: 'Realistický' },
  { id: 'illustration', label: 'Ilustrace' },
  { id: 'minimal', label: 'Minimalistický' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'modern', label: 'Moderní' }
]

export default function ImageGenerator() {
  const [selectedType, setSelectedType] = useState<ImageType>('hero')
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('realistic')
  const [description, setDescription] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const user = useAuthStore(state => state.user)

  const selectedOption = imageOptions.find(opt => opt.id === selectedType)!
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
          description: "Vyplňte prosím popis obrázku",
          variant: "destructive"
        })
        return
      }
    }

    if (userCredits < selectedOption.credits) {
      toast({
        title: "Nedostatek kreditů",
        description: `Pro tuto akci potřebujete ${selectedOption.credits} kreditů. Máte pouze ${userCredits}.`,
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/content/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          style: selectedStyle,
          description,
          additionalInfo,
          customPrompt: selectedType === 'custom' ? customPrompt : undefined,
          dimensions: selectedOption.dimensions,
          userId: user?.uid
        })
      })

      if (!response.ok) throw new Error('Failed to generate image')

      const data = await response.json()
      setGeneratedImages(data.images)
      
      // Update user credits locally (should be done server-side)
      if (user?.subscription && user.subscription.credits) {
        user.subscription.credits -= selectedOption.credits
      }

      toast({
        title: "Obrázky vygenerovány!",
        description: `Použito ${selectedOption.credits} kreditů`
      })
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat obrázky. Zkuste to prosím znovu.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${selectedType}-${Date.now()}-${index + 1}.png`
    link.click()
  }

  const handleSave = async () => {
    if (!user || generatedImages.length === 0) return
    
    setIsSaving(true)
    try {
      const title = `${selectedOption.label} - ${description || 'Vlastní obrázky'}`
      const contentId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Upload all images to Firebase Storage
      const uploadedImageUrls = await storageService.uploadImagesFromUrls(
        user.id, 
        contentId, 
        generatedImages
      )
      
      const prompt = selectedType === 'custom' ? {
        custom: customPrompt,
        style: selectedStyle
      } : {
        original: description,
        additionalInfo,
        style: selectedStyle
      }

      await generatedContentService.saveContent({
        userId: user.id,
        type: 'image',
        subType: selectedType,
        title: title.slice(0, 100),
        content: uploadedImageUrls, // Array of Firebase Storage URLs
        prompt,
        metadata: {
          credits: selectedOption.credits,
          contentLength: uploadedImageUrls.length,
          dimensions: selectedOption.dimensions
        },
        settings: {
          canEdit: false,
          canDownload: true,
          canShare: true
        }
      })

      toast({
        title: "Obrázky uloženy",
        description: `${uploadedImageUrls.length} obrázků bylo úspěšně uloženo do Firebase Storage a historie`
      })
    } catch (error) {
      console.error('Error saving images:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit obrázky. Zkuste to prosím znovu.",
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
          <div className="flex items-center gap-3 text-white mb-6">
            <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Generátor obrázků</h2>
              <p className="text-purple-200 text-sm">
                Vytvořte profesionální obrázky pomocí AI (Gemini Nano Banana)
              </p>
            </div>
          </div>
          {/* Type selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Typ obrázku</label>
            <div className="grid grid-cols-1 gap-2">
              {imageOptions.map(option => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedType === option.id 
                      ? 'border-purple-400 bg-purple-900/50' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedType(option.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{option.label}</span>
                    <span className="text-purple-300 text-sm font-semibold">{option.credits}k</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Rozměry: {option.dimensions}px
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Style selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Styl obrázku</label>
            <div className="grid grid-cols-2 gap-2">
              {styleOptions.map(option => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                    selectedStyle === option.id 
                      ? 'border-purple-400 bg-purple-900/50' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                  }`}
                  onClick={() => setSelectedStyle(option.id as ImageStyle)}
                >
                  <span className="text-white font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Popis obrázku *
            </label>
            <Input
              placeholder={selectedOption.placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>

          {/* Additional info */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Dodatečné požadavky (volitelné)
            </label>
            <Textarea
              placeholder="Např: barvy, kompozice, nálada, specifické prvky..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              rows={3}
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
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Fotorealistický obrázek moderní kavárny s velkými okny, teplé osvětlení, lidé sedící u stolů s notebooky, skandinávský design, útulná atmosféra, denní světlo')}>
                    <strong>Kavárna:</strong> "Fotorealistický obrázek moderní kavárny s velkými okny, teplé osvětlení, lidé sedící u stolů s notebooky, skandinávský design, útulná atmosféra, denní světlo"
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Minimalistická ilustrace ikony nákupního košíku, modré barvy, plochý design, čisté pozadí, vektorový styl, jednoduché tvary')}>
                    <strong>Ikona:</strong> "Minimalistická ilustrace ikony nákupního košíku, modré barvy, plochý design, čisté pozadí, vektorový styl, jednoduché tvary"
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Banner pro Facebook s textem "20% sleva", vánoční téma, červeno-zlaté barvy, elegantní typografie, sněhové vločky na pozadí, rozměry 1200x630px')}>
                    <strong>Banner:</strong> "Banner pro Facebook s textem '20% sleva', vánoční téma, červeno-zlaté barvy, elegantní typografie, sněhové vločky na pozadí, rozměry 1200x630px"
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>Tip:</strong> Popište styl (fotorealistický/ilustrace), barvy, kompozici, náladu a specifické prvky.
                </p>
              </div>
            </div>
          )}
          {/* Credits info */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm text-white">
                Tato akce spotřebuje <strong>{selectedOption.credits} kreditů</strong>
              </span>
            </div>
            <span className="text-sm font-semibold text-purple-300">
              Zbývá: {userCredits} kreditů
            </span>
          </div>

          {/* Generate button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || userCredits < selectedOption.credits}
            className="w-full bg-gradient-to-r from-naklikam-pink-500 to-naklikam-pink-600 hover:from-naklikam-pink-600 hover:to-naklikam-pink-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generuji obrázky...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Vygenerovat obrázky
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right side - Generated Images */}
      <div className="lg:sticky lg:top-6">
        {generatedImages.length > 0 ? (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Vygenerované obrázky</h3>
                  <p className="text-purple-200 text-sm">
                    Klikněte na obrázek pro stažení
                  </p>
                </div>
              </div>
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
            </div>
            <div className="grid grid-cols-1 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="relative group cursor-pointer">
                  <img 
                    src={image} 
                    alt={`Generated ${index + 1}`}
                    className="w-full rounded-lg border border-slate-600/50"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image, index)}
                      className="border-slate-600 text-white hover:bg-slate-800"
                    >
                      <Download size={16} className="mr-1" />
                      Stáhnout
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Náhled obrázků</h3>
            </div>
            <div className="aspect-square bg-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Zde se zobrazí vaše vygenerované obrázky</p>
                <p className="text-slate-500 text-xs mt-1">Vyplňte formulář vlevo a klikněte na generovat</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}