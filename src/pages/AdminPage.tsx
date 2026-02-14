import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { projectService } from '@/services/firebaseService'
import { Project } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Logo from '@/components/ui/logo'
import { UserMenu } from '@/components/UserMenu'
import { Search, Users, FileText, Shield, ExternalLink, Loader2, BarChart3, Database } from 'lucide-react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard'

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isLoading: authLoading } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'email' | 'projectId' | 'userId' | 'name'>('name')
  const [userInfoCache, setUserInfoCache] = useState<Record<string, any>>({})
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    publicProjects: 0,
    privateProjects: 0
  })
  const [isLimited, setIsLimited] = useState(true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'projects'>('analytics')

  useEffect(() => {
    console.log('Admin check - Email:', user?.email, 'Is Admin:', isAdmin)
    if (!authLoading && !isAdmin) {
      navigate('/dashboard')
    } else if (!authLoading && isAdmin) {
      loadAllProjects()
    }
  }, [isAdmin, authLoading, navigate, user])

  const loadAllProjects = async () => {
    setIsLoading(true)
    try {
      console.log('Loading projects...')
      const startTime = Date.now()
      
      // Load only first 50 projects initially for faster loading, or all if requested
      const limit = isLimited ? 50 : undefined
      const allProjects = await projectService.getAllProjects(limit)
      console.log(`Loaded ${allProjects.length} projects in ${Date.now() - startTime}ms`)
      
      setProjects(allProjects)
      setFilteredProjects(allProjects)
      
      // Calculate stats
      const uniqueUsers = new Set(allProjects.map(p => p.ownerId))
      setStats({
        totalProjects: allProjects.length,
        totalUsers: uniqueUsers.size,
        publicProjects: allProjects.filter(p => p.isPublic).length,
        privateProjects: allProjects.filter(p => !p.isPublic).length
      })
      
      // Load user info in background (non-blocking)
      const userIds = Array.from(uniqueUsers)
      console.log(`Loading info for ${userIds.length} users...`)
      
      // Load users in batches of 10 to avoid overwhelming Firebase
      const batchSize = 10
      const cache: Record<string, any> = {}
      
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)
        const batchPromises = batch.map(async (userId) => {
          try {
            const userInfo = await projectService.getUserInfo(userId)
            return { userId, userInfo }
          } catch {
            return { userId, userInfo: null }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        batchResults.forEach(({ userId, userInfo }) => {
          if (userInfo) {
            cache[userId] = userInfo
          }
        })
        
        // Update cache progressively
        setUserInfoCache({...cache})
        
        // Small delay to not overwhelm Firebase
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log(`Loaded user info for ${Object.keys(cache).length} users`)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm) {
      setFilteredProjects(projects)
      return
    }

    setIsLoading(true)
    try {
      const results = await projectService.searchProjects(searchTerm, searchType)
      setFilteredProjects(results)
    } catch (error) {
      console.error('Error searching projects:', error)
      setFilteredProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  const getUserEmail = (userId: string) => {
    return userInfoCache[userId]?.email || 'Načítá se...'
  }

  const loadAllProjectsUnlimited = async () => {
    setIsLimited(false)
    await loadAllProjects()
  }

  const openProject = (projectId: string) => {
    navigate(`/project/${projectId}`)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <span className="text-lg font-semibold text-destructive">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Zpět na Dashboard
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-primary text-white'
                : 'bg-card hover:bg-muted text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'bg-primary text-white'
                : 'bg-card hover:bg-muted text-foreground'
            }`}
          >
            <Database className="w-4 h-4" />
            Projekty
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Celkem projektů
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalProjects}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Celkem uživatelů
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Veřejné projekty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.publicProjects}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Soukromé projekty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stats.privateProjects}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vyhledávání projektů</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="name">Název projektu</option>
                <option value="email">Email tvůrce</option>
                <option value="projectId">ID projektu</option>
                <option value="userId">User ID</option>
              </select>
              <Input
                placeholder={`Vyhledat podle ${
                  searchType === 'name' ? 'názvu' :
                  searchType === 'email' ? 'emailu' :
                  searchType === 'projectId' ? 'ID projektu' :
                  'User ID'
                }...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Vyhledat
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setFilteredProjects(projects)
                }}
              >
                Vymazat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Projekty ({filteredProjects.length}{isLimited ? ' - prvních 50' : ''})
              </CardTitle>
              {isLimited && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAllProjectsUnlimited}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Načíst všechny
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Název</th>
                    <th className="text-left p-2">Tvůrce</th>
                    <th className="text-left p-2">User ID</th>
                    <th className="text-left p-2">Typ</th>
                    <th className="text-left p-2">Vytvořeno</th>
                    <th className="text-left p-2">Aktualizováno</th>
                    <th className="text-left p-2">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">
                        {project.id.substring(0, 8)}...
                      </td>
                      <td className="p-2 font-medium">{project.name}</td>
                      <td className="p-2 text-sm">{getUserEmail(project.ownerId)}</td>
                      <td className="p-2 font-mono text-xs">
                        {project.ownerId.substring(0, 8)}...
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.isPublic 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {project.isPublic ? 'Veřejný' : 'Soukromý'}
                        </span>
                      </td>
                      <td className="p-2 text-sm">
                        {format(new Date(project.createdAt), 'd.M.yyyy', { locale: cs })}
                      </td>
                      <td className="p-2 text-sm">
                        {format(new Date(project.updatedAt), 'd.M.yyyy HH:mm', { locale: cs })}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProject(project.id)}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Otevřít
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Žádné projekty nenalezeny
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}