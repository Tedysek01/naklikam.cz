import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import Logo from '@/components/ui/logo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'

import { useAuthStore } from '@/store/authStore'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const isSignupMode = searchParams.get('mode') === 'signup'
  
  const [isLogin, setIsLogin] = useState(!isSignupMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  
  const { login, signup, resetPassword } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLogin && !termsAccepted) {
      setError('Musíte souhlasit s podmínkami užití')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(email, password, name)
      }
      // Check if there's a pending prompt from landing page
      const pendingPrompt = localStorage.getItem('pendingPrompt')
      if (pendingPrompt) {
        localStorage.removeItem('pendingPrompt')
        // Navigate back to home page to process the prompt
        navigate('/')
      } else {
        // Check returnTo parameter
        const returnTo = searchParams.get('returnTo')
        navigate(returnTo || '/dashboard')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      // Handle Firebase specific errors
      if (error.code === 'auth/email-already-in-use') {
        setError('Tento e-mail je již registrován')
      } else if (error.code === 'auth/invalid-email') {
        setError('Neplatný formát e-mailu')
      } else if (error.code === 'auth/weak-password') {
        setError('Heslo musí mít alespoň 6 znaků')
      } else if (error.code === 'auth/user-not-found') {
        setError('Uživatel s tímto e-mailem neexistuje')
      } else if (error.code === 'auth/wrong-password') {
        setError('Nesprávné heslo')
      } else if (error.code === 'auth/invalid-credential') {
        setError('Nesprávný e-mail nebo heslo')
      } else {
        setError('Došlo k chybě. Zkuste to prosím znovu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Zadejte prosím e-mailovou adresu')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await resetPassword(email)
      setResetEmailSent(true)
      setShowResetPassword(false)
    } catch (error: any) {
      console.error('Reset password error:', error)
      if (error.code === 'auth/user-not-found') {
        setError('Uživatel s tímto e-mailem neexistuje')
      } else if (error.code === 'auth/invalid-email') {
        setError('Neplatný formát e-mailu')
      } else {
        setError('Došlo k chybě. Zkuste to prosím znovu.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-2xl font-semibold font-display text-foreground">
            {isLogin ? 'Vítejte zpět' : 'Vytvořte si účet'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Přihlaste se do svého účtu' : 'Začněte vytvářet s pomocí AI'}
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              {showResetPassword ? 'Obnovení hesla' : isLogin ? 'Přihlášení' : 'Registrace'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resetEmailSent && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-500 text-center">
                  E-mail pro obnovení hesla byl odeslán. Zkontrolujte svou e-mailovou schránku.
                </p>
              </div>
            )}
            
            {showResetPassword ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium mb-2 text-foreground">
                    E-mail
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="zadejte@email.cz"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white font-medium" 
                  disabled={loading}
                >
                  {loading ? 'Odesílám...' : 'Odeslat e-mail pro obnovení'}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false)
                      setError(null)
                      setResetEmailSent(false)
                    }}
                    className="text-sm text-naklikam-pink-500 hover:text-naklikam-pink-400 transition-colors"
                  >
                    Zpět na přihlášení
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                    Celé jméno
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Zadejte své jméno"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="zadejte@email.cz"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                  Heslo
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Zadejte heslo"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                />
              </div>
              
              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(true)
                      setError(null)
                    }}
                    className="text-sm text-naklikam-pink-500 hover:text-naklikam-pink-400 transition-colors"
                  >
                    Zapomenuté heslo?
                  </button>
                </div>
              )}
              
              {!isLogin && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                    className="mt-1"
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    Souhlasím s{' '}
                    <a href="/terms" target="_blank" className="text-naklikam-pink-500 hover:underline">
                      podmínkami užití
                    </a>{' '}
                    a{' '}
                    <a href="/privacy" target="_blank" className="text-naklikam-pink-500 hover:underline">
                      zásadami ochrany osobních údajů
                    </a>
                  </label>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white font-medium" 
                disabled={loading}
              >
                {loading ? 'Načítám...' : isLogin ? 'Přihlásit se' : 'Registrovat se'}
              </Button>
            </form>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500 text-center">{error}</p>
              </div>
            )}
            
            {!showResetPassword && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-naklikam-pink-500 hover:text-naklikam-pink-400 transition-colors"
                >
                  {isLogin 
                    ? "Nemáte účet? Registrujte se" 
                    : "Už máte účet? Přihlaste se"
                  }
                </button>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}