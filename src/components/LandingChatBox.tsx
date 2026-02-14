import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { useChatStore } from '@/store/chatStore'
import { Send, Loader2, AlertCircle, Lock, AlertTriangle } from 'lucide-react'

interface LandingChatBoxProps {
  placeholder?: string;
}

export default function LandingChatBox({ placeholder }: LandingChatBoxProps = {}) {
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { createProject } = useProjectStore()
  const { createSession } = useChatStore()

  // Check for pending prompt after user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const pendingPrompt = localStorage.getItem('pendingPrompt')
      if (pendingPrompt) {
        localStorage.removeItem('pendingPrompt')
        setPrompt(pendingPrompt)
        // Auto-submit after a short delay
        setTimeout(() => {
          handleSubmit(new Event('submit') as any)
        }, 1000)
      }
    }
  }, [isAuthenticated, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) return
    
    setIsProcessing(true)
    setError(null)
    setStatus('')

    try {
      // 1. Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('Pro vytvoření projektu se musíte přihlásit')
        // Store prompt in localStorage to use after login
        localStorage.setItem('pendingPrompt', prompt)
        setTimeout(() => {
          navigate('/auth')
        }, 2000)
        return
      }

      // 2. Check subscription and tokens
      setStatus('Kontroluji vaše členství...')
      
      if (!user.subscription) {
        setError('Nemáte aktivní předplatné. Pro vytvoření projektů si prosím zakupte některý z našich plánů.')
        setTimeout(() => {
          navigate('/auth#cenik')
        }, 3000)
        return
      }
      
      // const hasTokens = await subscriptionService.hasEnoughTokens(user.id)
      
      // if (!hasTokens) {
      //   setError('Nemáte dostatek tokenů. Prosím obnovte své členství nebo upgradujte plán.')
      //   return
      // }

      // 3. Create new project
      setStatus('Vytvářím nový projekt...')
      const projectName = prompt.slice(0, 50) // Use first 50 chars as project name
      const newProject = await createProject({
        name: projectName,
        description: `Projekt vytvořený z promptu: ${prompt}`,
        isPublic: false
      })

      if (!newProject) {
        throw new Error('Nepodařilo se vytvořit projekt')
      }

      // 4. Create chat session for the project
      setStatus('Inicializuji AI asistenta...')
      await createSession(newProject.id)

      // 5. Store the initial prompt for ChatPanel to pick up
      localStorage.setItem('initialProjectPrompt', prompt)
      localStorage.setItem('initialProjectId', newProject.id)

      // 6. Navigate to project
      navigate(`/project/${newProject.id}`)

    } catch (error: any) {
      console.error('Error creating project:', error)
      setError(error.message || 'Něco se pokazilo. Zkuste to prosím znovu.')
    } finally {
      setIsProcessing(false)
      setStatus('')
    }
  }



  return (
    <div className="relative group">
      <form onSubmit={handleSubmit} className="relative bg-card/80 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 py-4 md:px-6 md:py-6 shadow-xl border border-pink-500/30 group-hover:border-pink-500/50 group-focus-within:border-pink-500/70 transition-all duration-300 max-w-4xl mx-auto" style={{boxShadow: '0 0 20px rgba(236, 72, 153, 0.1), 0 0 40px rgba(168, 85, 247, 0.1)'}}>
        
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder || "Napište co chcete vytvořit - například: e-shop s košíkem a platbami, firemní web s kontaktním formulářem, nebo aplikaci pro správu úkolů..."}
            className="w-full bg-transparent text-sm md:text-lg focus:outline-none placeholder:text-muted-foreground/60 resize-none min-h-[80px] md:min-h-[90px] py-2 pr-12 leading-relaxed"
            disabled={isProcessing}
            rows={3}
          />
          <div className="absolute bottom-14 right-2 text-xs text-muted-foreground">
            {prompt.length}/500
          </div>
          <Button 
            type="submit"
            className="absolute bottom-2 right-2 bg-naklikam-gradient hover:bg-naklikam-gradient-dark rounded-full p-3"
            disabled={isProcessing || !prompt.trim()}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Long prompt warning */}
        {prompt.length > 500 && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Dlouhý prompt ({prompt.length} znaků)</p>
              <p className="text-xs mt-1">
                AI pracuje lépe s kratšími a strukturovanými prompty. Zkuste být konkrétnější nebo rozdělit požadavek na menší části.
              </p>
            </div>
          </div>
        )}

        {/* Status message */}
        {status && (
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-3 text-sm text-red-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Token usage bar temporarily hidden */}
        {/* {tokenInfo && user?.subscription?.plan !== 'unlimited' && (
          <div className="mt-4">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  tokenInfo.percentage > 20 ? 'bg-naklikam-gradient' : 'bg-red-500'
                }`}
                style={{ width: `${tokenInfo.percentage}%` }}
              />
            </div>
          </div>
        )} */}

        {/* Show login prompt for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Pro vytvoření projektu se musíte přihlásit
            </span>
          </div>
        )}
        
        {/* Subscription prompts */}
        {isAuthenticated && user && !user.subscription && (
          <div className="mt-4 p-4 bg-gradient-to-br from-naklikam-purple-500/10 to-naklikam-pink-500/10 border border-naklikam-purple-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-naklikam-purple-600" />
            <span className="text-sm text-foreground font-medium">
              Pro vytvoření projektů si prosím zakupte některý z našich plánů
            </span>
          </div>
        )}
      </form>
    </div>
  )
}