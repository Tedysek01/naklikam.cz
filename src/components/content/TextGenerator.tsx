import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Copy, Download, Sparkles, FileText, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { generatedContentService } from '@/services/generatedContentService'

type TextType = 'web-homepage' | 'web-services' | 'web-about' | 'cta' | 'social-fb' | 'social-ig' | 'email' | 'blog' | 'custom'

interface TextOption {
  id: TextType
  label: string
  placeholder: string
  credits: number
}

const textOptions: TextOption[] = [
  { id: 'web-homepage', label: 'Homepage text', placeholder: 'Např: Cukrárna s domácími dorty', credits: 2 },
  { id: 'web-services', label: 'Text služeb', placeholder: 'Např: Svatební dorty na míru', credits: 2 },
  { id: 'web-about', label: 'O nás', placeholder: 'Např: Rodinná cukrárna s 20letou tradicí', credits: 2 },
  { id: 'cta', label: 'CTA a slogany', placeholder: 'Např: Objednejte si dort snů', credits: 2 },
  { id: 'social-fb', label: 'Facebook post', placeholder: 'Např: Nová kolekce vánočního cukroví', credits: 2 },
  { id: 'social-ig', label: 'Instagram post', placeholder: 'Např: Čokoládový dort s malinami', credits: 2 },
  { id: 'email', label: 'E-mail kampaň', placeholder: 'Např: Vánoční sleva 20% na cukroví', credits: 2 },
  { id: 'blog', label: 'Blog článek', placeholder: 'Např: Jak vybrat dort na svatbu', credits: 2 },
  { id: 'custom', label: '🎯 Vlastní prompt', placeholder: 'Napište vlastní zadání...', credits: 2 }
]

export default function TextGenerator() {
  const [selectedType, setSelectedType] = useState<TextType>('web-homepage')
  const [businessInfo, setBusinessInfo] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const user = useAuthStore(state => state.user)

  const selectedOption = textOptions.find(opt => opt.id === selectedType)!
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
      if (!businessInfo) {
        toast({
          title: "Chyba",
          description: "Vyplňte prosím informace o vašem podnikání",
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
      const response = await fetch('/api/content/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          businessInfo,
          additionalInfo,
          customPrompt: selectedType === 'custom' ? customPrompt : undefined,
          userId: user?.uid
        })
      })

      if (!response.ok) throw new Error('Failed to generate text')

      const data = await response.json()
      setGeneratedText(data.text)
      
      // Update user credits locally (should be done server-side)
      if (user?.subscription && user.subscription.credits) {
        user.subscription.credits -= selectedOption.credits
      }

      toast({
        title: "Text vygenerován!",
        description: `Použito ${selectedOption.credits} kreditů`
      })
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vygenerovat text. Zkuste to prosím znovu.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText)
    toast({
      title: "Zkopírováno",
      description: "Text byl zkopírován do schránky"
    })
  }

  const handleDownload = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedType}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!user || !generatedText) return
    
    try {
      const title = `${selectedOption.label} - ${businessInfo || 'Vlastní text'}`
      const prompt = selectedType === 'custom' ? {
        custom: customPrompt,
        businessInfo
      } : {
        original: selectedOption.placeholder,
        businessInfo,
        additionalInfo
      }

      await generatedContentService.saveContent({
        userId: user.id,
        type: 'text',
        subType: selectedType,
        title: title.slice(0, 100), // Limit title length
        content: generatedText,
        prompt,
        metadata: {
          credits: selectedOption.credits,
          contentLength: generatedText.length
        },
        settings: {
          canEdit: true,
          canDownload: true,
          canShare: false
        }
      })

      toast({
        title: "Text uložen",
        description: "Text byl úspěšně uložen do vaší historie"
      })
    } catch (error) {
      console.error('Error saving text:', error)
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit text. Zkuste to prosím znovu.",
        variant: "destructive"
      })
    }
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left side - Generator Form */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
          <div className="flex items-center gap-3 text-white mb-6">
            <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Generátor textů</h2>
              <p className="text-purple-200 text-sm">
                Vytvořte profesionální texty pro váš web a marketing
              </p>
            </div>
          </div>
          
          {/* Type selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Typ textu</label>
            <div className="grid grid-cols-1 gap-2">
              {textOptions.map(option => (
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
                    <span className="text-purple-300 text-sm font-semibold">{option.credits}k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business info input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Informace o vašem podnikání *
            </label>
            <Input
              placeholder={selectedOption.placeholder}
              value={businessInfo}
              onChange={(e) => setBusinessInfo(e.target.value)}
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-400"
            />
          </div>

          {/* Additional info */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Dodatečné informace (volitelné)
            </label>
            <Textarea
              placeholder="Např: cílová skupina, styl komunikace, speciální nabídky..."
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
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Napiš profesionální text na homepage pro moderní IT firmu. Zdůrazni inovace, spolehlivost a osobní přístup. Styl: profesionální ale přátelský. Délka: 150-200 slov.')}>
                    <strong>Homepage:</strong> "Napiš profesionální text na homepage pro moderní IT firmu. Zdůrazni inovace, spolehlivost a osobní přístup. Styl: profesionální ale přátelský. Délka: 150-200 slov."
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Vytvoř catchy Instagram post pro kavárnu. Téma: nová káva měsíce. Použij emojis, hashtags a call-to-action. Styl: mladistvý a energický. Maximálně 100 slov.')}>
                    <strong>Social media:</strong> "Vytvoř catchy Instagram post pro kavárnu. Téma: nová káva měsíce. Použij emojis, hashtags a call-to-action. Styl: mladistvý a energický. Maximálně 100 slov."
                  </div>
                  <div className="cursor-pointer hover:text-white p-2 bg-slate-700/50 rounded" onClick={() => setCustomPrompt('Napiš přesvědčivý CTA text pro tlačítko objednávky. Cíl: zvýšit konverze. Zdůrazni urgenci a výhody. Styl: přímý a akční. Délka: 10-15 slov.')}>
                    <strong>CTA:</strong> "Napiš přesvědčivý CTA text pro tlačítko objednávky. Cíl: zvýšit konverze. Zdůrazni urgenci a výhody. Styl: přímý a akční. Délka: 10-15 slov."
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>Tip:</strong> Specifikujte typ textu, cílovou skupinu, styl komunikace a požadovanou délku.
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
            className="w-full bg-gradient-to-r from-naklikam-purple-500 to-naklikam-purple-600 hover:from-naklikam-purple-600 hover:to-naklikam-purple-700 text-white font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generuji...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Vygenerovat text
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right side - Generated Text */}
      <div className="lg:sticky lg:top-6">
        {generatedText ? (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-naklikam-gradient rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Vygenerovaný text</h3>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSave}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  <Save size={16} className="mr-1" />
                  Uložit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopy}
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  <Copy size={16} className="mr-1" />
                  Kopírovat
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
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                {generatedText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-purple-400/50 rounded-2xl p-6 shadow-xl shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Náhled textu</h3>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-600/50 flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Zde se zobrazí váš vygenerovaný text</p>
                <p className="text-slate-500 text-xs mt-1">Vyplňte formulář vlevo a klikněte na generovat</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}