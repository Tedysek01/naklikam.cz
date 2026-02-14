import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import Logo from '@/components/ui/logo'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { UserMenu } from '@/components/UserMenu'
import { Plus, Calendar, Trash2, Loader2, Sparkles, FileText, Image, Video } from 'lucide-react'
import GitHubService, { githubService } from '@/services/GitHubService'
import { useToast } from '@/hooks/use-toast'
import Pricing from '@/components/Pricing'
import { trackPurchase, trackViewContent } from '@/utils/analytics'
import { MobileWarning, MobileWarningModal } from '@/components/MobileWarning'

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [searchParams] = useSearchParams()
  
  const { user, isLoading: authLoading } = useAuthStore()
  const { projects, createProject, deleteProject, setCurrentProject, loadProjects, isLoading, error, clearError } = useProjectStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !authLoading) {
      loadProjects()
      trackViewContent('Dashboard', 'dashboard')
      
      // Check if returning from successful Stripe checkout
      const sessionId = searchParams.get('session_id')
      if (sessionId) {
        // Fetch exact session details and track accurate purchase
        const trackStripeSession = async () => {
          try {
            const response = await fetch(`/api/stripe/get-session-details?session_id=${sessionId}`)
            if (response.ok) {
              const sessionDetails = await response.json()
              console.log('Stripe session details:', sessionDetails)
              
              if (sessionDetails.paymentStatus === 'paid' && sessionDetails.amount > 0) {
                // Track purchase with accurate data
                trackPurchase(sessionDetails.amount, [sessionDetails.plan])
                
                // Also track subscription started
                import('@/utils/analytics').then(({ trackSubscriptionStarted }) => {
                  trackSubscriptionStarted(sessionDetails.plan, sessionDetails.amount)
                })
                
                console.log('🎉 Tracked successful purchase:', {
                  plan: sessionDetails.plan,
                  amount: sessionDetails.amount,
                  sessionId: sessionDetails.sessionId
                })
              }
            }
          } catch (error) {
            console.error('Error fetching session details for tracking:', error)
            // Fallback to generic tracking
            if (user.subscription?.plan) {
              const planPrices: Record<string, number> = {
                trial: 70,
                starter: 580,
                professional: 1290
              }
              const price = planPrices[user.subscription.plan] || 0
              if (price > 0) {
                trackPurchase(price, [user.subscription.plan])
              }
            }
          }
        }
        
        trackStripeSession()
        
        toast({
          title: "Platba byla úspěšná!",
          description: "Váš plán byl aktivován. Můžete začít tvořit!",
        })
        
        // Remove session_id from URL
        navigate('/dashboard', { replace: true })
      }
    } else if (!user && !authLoading) {
      navigate('/auth')
    }
  }, [user, authLoading, loadProjects, navigate, searchParams, toast])

  // Handle GitHub OAuth callback
  useEffect(() => {
    const handleGitHubCallback = () => {
      const { token, user: username, error } = GitHubService.parseOAuthCallback();
      
      if (error) {
        toast({
          title: "GitHub Connection Failed",
          description: error,
          variant: "destructive",
        });
        GitHubService.cleanOAuthParams();
        return;
      }

      if (token && username) {
        githubService.setToken(token);
        toast({
          title: "GitHub Connected!",
          description: `Successfully connected as ${username}`,
        });
        GitHubService.cleanOAuthParams();
      }
    };

    handleGitHubCallback();
  }, [])

  useEffect(() => {
    if (error) {
      console.error('Dashboard error:', error)
      setTimeout(() => clearError(), 5000)
    }
  }, [error, clearError])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user has active subscription (free plan is ok)
    if (!user?.subscription) {
      toast({
        title: "Předplatné vyžadováno",
        description: "Pro vytvoření projektu potřebujete aktivní předplatné.",
        variant: "destructive",
      })
      setShowCreateModal(false)
      return
    }
    
    if (projectName.trim()) {
      await createProject({ name: projectName, description: projectDescription })
      setProjectName('')
      setProjectDescription('')
      setShowCreateModal(false)
    }
  }

  const handleProjectClick = (project: any) => {
    setCurrentProject(project)
    navigate(`/project/${project.id}`)
  }


  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-naklikam-pink-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileWarning />
      <MobileWarningModal />
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <div className="hidden md:flex gap-1">
              <Button 
                variant="ghost" 
                className="bg-gray-100 text-gray-900"
              >
                Web
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/content-marketing')}
                className="text-gray-600 hover:text-gray-900"
              >
                Obsah & Marketing
              </Button>
            </div>
          </div>
          <UserMenu />
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 py-4 md:py-6 lg:py-8">
        {/* If no subscription, show pricing instead of projects */}
        {!user.subscription ? (
          <Pricing />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Moje projekty</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                  Spravujte své webové aplikace na jednom místě
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white w-full sm:w-auto"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Nový projekt</span>
              </Button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-naklikam-pink-500" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-naklikam-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold font-display text-foreground mb-3">
                  Zatím žádné projekty
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                  Vytvořte svůj první projekt a začněte stavět úžasné webové aplikace pomocí AI
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">Vytvořit první projekt</span>
                </Button>
              </div>
            ) : (
              <>
              {/* Content & Marketing Banner */}
              <div className="mb-8">
                <Card 
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-slate-900 via-purple-900/50 to-slate-900 border-2 border-naklikam-pink-400/30 hover:border-naklikam-pink-500 group relative overflow-hidden"
                  onClick={() => navigate('/content-marketing')}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-naklikam-purple-500/10 via-naklikam-pink-500/10 to-naklikam-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-naklikam-gradient rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-naklikam-pink-400 transition-colors">
                              🎉 Nová funkce: Obsah & Marketing
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                              NOVÉ
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            Generujte profesionální texty, obrázky a videa pro váš web a marketing pomocí AI. 
                            Ušetřete čas a vytvořte kvalitní obsah jednoduše.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                        {/* Features */}
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-8 h-8 bg-naklikam-pink-500/10 rounded-lg flex items-center justify-center border border-naklikam-pink-500/20">
                              <FileText className="h-4 w-4 text-naklikam-pink-400" />
                            </div>
                            <span>Texty</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-8 h-8 bg-naklikam-pink-500/10 rounded-lg flex items-center justify-center border border-naklikam-pink-500/20">
                              <Image className="h-4 w-4 text-naklikam-pink-400" />
                            </div>
                            <span>Obrázky</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-8 h-8 bg-naklikam-pink-500/10 rounded-lg flex items-center justify-center border border-naklikam-pink-500/20">
                              <Video className="h-4 w-4 text-naklikam-pink-400" />
                            </div>
                            <span>Videa</span>
                          </div>
                        </div>
                        
                        {/* CTA Button */}
                        <Button 
                          className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white px-6 py-2 group-hover:shadow-lg transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/content-marketing')
                          }}
                        >
                          Vyzkoušet
                          <Sparkles className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.map((project) => (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-card border-border hover:border-naklikam-pink-500/50 group"
                    onClick={() => handleProjectClick(project)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-foreground group-hover:text-naklikam-pink-500 transition-colors">
                          {project.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            deleteProject(project.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Vytvořeno {new Date(project.createdAt).toLocaleDateString('cs-CZ')}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {project.files.length} souborů
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm sm:max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Nový projekt</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium mb-2 text-foreground">
                    Název projektu
                  </label>
                  <Input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Můj úžasný web"
                    required
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                  />
                </div>
                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium mb-2 text-foreground">
                    Popis (volitelný)
                  </label>
                  <Input
                    id="projectDescription"
                    type="text"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Krátký popis vašeho projektu"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-naklikam-pink-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 order-2 sm:order-1"
                  >
                    Zrušit
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white order-1 sm:order-2"
                  >
                    Vytvořit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}