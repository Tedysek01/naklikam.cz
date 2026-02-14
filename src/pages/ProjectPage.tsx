import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { useDeploymentStore } from '@/store/deploymentStore'
import { canAccessDeployment, getUpgradeMessage, canViewCode, canDownloadCode } from '@/utils/subscriptionUtils'
import { trackViewContent } from '@/utils/analytics'
import FileTree from '@/components/FileTree'
import CodeEditor from '@/components/CodeEditor'
import ChatPanel from '@/components/ChatPanel'
import PreviewPanel from '@/components/PreviewPanel'
import TerminalPanel from '@/components/TerminalPanel'
import ImageUploadArea from '@/components/ImageUploadArea'
import ProjectSettingsDialog from '@/components/ProjectSettingsDialog'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ProjectFile } from '@/types'
import { 
  Code, 
  ArrowLeft, 
  Settings, 
  Download,
  MessageSquare,
  Eye,
  Terminal,
  MousePointer2,
  Rocket,
  HelpCircle
} from 'lucide-react'
import GitHubConnect from '@/components/deployment/GitHubConnect'
import VercelConnect from '@/components/deployment/VercelConnect'
import UpgradePrompt from '@/components/deployment/UpgradePrompt'

type ViewMode = 'code' | 'preview' | 'deploy'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuthStore()
  const { currentProject, loadProject, isLoading, uploadProjectImage } = useProjectStore()
  const { 
    selectedRepository,
    setSelectedRepository, 
    setVercelProject 
  } = useDeploymentStore()
  
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('code')
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  const handleImageUpload = async (file: File, blob: Blob, fileName: string) => {
    if (!currentProject) return
    await uploadProjectImage(file, blob, fileName)
  }

  const handleDownloadCode = async () => {
    if (!currentProject) return

    // Dynamically import JSZip to keep bundle size smaller
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Add all project files to zip
    currentProject.files.forEach(file => {
      if (!file.isDirectory && file.content) {
        // Create proper file path structure
        const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
        zip.file(filePath, file.content)
      }
    })

    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_code.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth')
      return
    }

    if (user && id && (!currentProject || currentProject.id !== id)) {
      loadProject(id)
      trackViewContent('Project Editor', 'project', 0)
    }
  }, [id, user, authLoading, currentProject, loadProject, navigate])

  useEffect(() => {
    if (currentProject?.files.length && !selectedFile) {
      setSelectedFile(currentProject.files[0])
    }
  }, [currentProject, selectedFile])

  // Update selectedFile when its content changes
  useEffect(() => {
    if (selectedFile && currentProject) {
      const updatedFile = currentProject.files.find(f => f.id === selectedFile.id)
      if (updatedFile && updatedFile.content !== selectedFile.content) {
        setSelectedFile(updatedFile)
      }
    }
  }, [currentProject?.files, selectedFile?.id])

  if (authLoading || isLoading || !currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naklikam-pink-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítám projekt...</p>
        </div>
      </div>
    )
  }

  const renderRightPanel = () => {
    return (
      <>
        {/* Code Panel - only visible when viewMode is 'code' */}
        <div 
          className={`h-full ${viewMode === 'code' ? 'block' : 'hidden'}`}
        >
          {/* Desktop: Side-by-side layout */}
          <div className="hidden md:flex h-full">
            {/* File Tree */}
            <div className="w-64 border-r border-border bg-card">
              <ErrorBoundary>
                <FileTree 
                  onFileSelect={setSelectedFile} 
                  selectedFileId={selectedFile?.id} 
                />
              </ErrorBoundary>
            </div>
            {/* Code Editor */}
            <div className="flex-1">
              {canViewCode(user) ? (
                <ErrorBoundary>
                  <CodeEditor file={selectedFile} />
                </ErrorBoundary>
              ) : (
                <div className="flex items-center justify-center p-8 h-full">
                  <UpgradePrompt 
                    feature="code_view"
                    message={getUpgradeMessage('code_view')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Stacked layout with collapsible file tree */}
          <div className="md:hidden h-full flex flex-col">
            {/* Mobile File Tree - collapsible */}
            <div className="border-b border-border bg-card max-h-64 overflow-y-auto">
              <ErrorBoundary>
                <FileTree 
                  onFileSelect={setSelectedFile} 
                  selectedFileId={selectedFile?.id} 
                />
              </ErrorBoundary>
            </div>
            
            {/* Mobile Code Editor */}
            <div className="flex-1 overflow-hidden">
              {canViewCode(user) ? (
                <ErrorBoundary>
                  <CodeEditor file={selectedFile} />
                </ErrorBoundary>
              ) : (
                <div className="flex items-center justify-center p-8 h-full">
                  <UpgradePrompt 
                    feature="code_view"
                    message={getUpgradeMessage('code_view')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Preview Panel - only visible when viewMode is 'preview' */}
        <div 
          className={`h-full ${viewMode === 'preview' ? 'block' : 'hidden'}`}
        >
          <ErrorBoundary>
            <PreviewPanel />
          </ErrorBoundary>
        </div>

        {/* Deploy Panel - only visible when viewMode is 'deploy' */}
        <div 
          className={`h-full ${viewMode === 'deploy' ? 'block' : 'hidden'}`}
        >
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <ErrorBoundary>
              {(() => {
                const hasAccess = canAccessDeployment(user);
                console.log('🚀 Deploy panel debug:', { 
                  hasAccess, 
                  userPlan: user?.subscription?.plan,
                  user: user ? 'exists' : 'null'
                });
                return hasAccess;
              })() ? (
                <>
                  <GitHubConnect 
                    onRepositorySelected={(repo) => {
                      console.log('Repository selected:', repo);
                      setSelectedRepository(repo);
                    }}
                  />
                  
                  {selectedRepository && (
                    <VercelConnect 
                      githubRepository={selectedRepository}
                      onProjectCreated={(project) => {
                        console.log('Vercel project created:', project);
                        setVercelProject(project);
                      }}
                    />
                  )}

                </>
              ) : (
                <UpgradePrompt 
                  feature="deployment"
                  message={getUpgradeMessage('deployment')}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex-shrink-0 min-h-[40px] md:min-h-[36px]"
              >
                <ArrowLeft className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Zpět</span>
              </Button>
              
              <div className="flex items-center space-x-2 min-w-0">
                <div className="bg-naklikam-gradient p-2 rounded-lg flex-shrink-0">
                  <MousePointer2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-lg font-semibold font-display text-foreground truncate">{currentProject.name}</h1>
                  {currentProject.description && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate hidden md:block">{currentProject.description}</p>
                  )}
                </div>
              </div>
            </div>
        
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {/* Help Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/navody')}
              className="min-h-[40px] md:min-h-[36px]"
              title="Návody a nápověda"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            {currentProject && (
              <ImageUploadArea 
                projectId={currentProject.id}
                onUpload={handleImageUpload}
              />
            )}
            {/* Download Button - Hide text on mobile */}
            {canDownloadCode(user) && (
              <Button variant="ghost" size="sm" onClick={handleDownloadCode} className="hidden md:flex">
                <Download className="h-4 w-4 mr-2" />
                Stáhnout kód
              </Button>
            )}
            {canDownloadCode(user) && (
              <Button variant="ghost" size="sm" onClick={handleDownloadCode} className="md:hidden min-h-[40px]">
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {/* Deploy Button - Hide text on mobile, different behavior */}
            {canAccessDeployment(user) ? (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setViewMode('deploy')}
                  className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white hidden md:flex"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setViewMode('deploy')}
                  className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark text-white md:hidden min-h-[40px]"
                >
                  <Rocket className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/subscription')}
                className="border-naklikam-pink-300 text-naklikam-pink-700 hover:bg-naklikam-pink-50 hidden md:flex"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Upgrade pro Deploy
              </Button>
            )}
            
            {/* Terminal & Settings - Always show icons only */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`hidden md:flex ${isTerminalOpen ? 'bg-accent' : ''}`}
            >
              <Terminal className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettingsDialog(true)}
              className="min-h-[40px] md:min-h-[36px]"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile/Desktop responsive layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Left Sidebar - Chat */}
        <div className="hidden md:block md:w-96 lg:w-[420px] xl:w-[450px]">
          <div className="h-full border-r border-border">
            <div className="border-b border-border p-3 bg-card">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-naklikam-pink-500" />
                <h3 className="font-semibold font-display text-foreground">AI Asistent</h3>
              </div>
            </div>
            <div className="h-[calc(100%-60px)]">
              <ErrorBoundary>
                <ChatPanel projectId={currentProject.id} />
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Mobile: Full screen view with tabs */}
        <div className="flex-1 flex flex-col md:hidden">
          {/* Mobile Tab Switcher - Chat/Code only */}
          <div className="border-b border-border bg-card">
            <div className="flex">
              <button
                onClick={() => setViewMode('code')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-colors min-h-[48px] ${
                  viewMode === 'code'
                    ? 'bg-background text-foreground border-b-2 border-naklikam-pink-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setViewMode('deploy')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-colors min-h-[48px] ${
                  viewMode === 'deploy'
                    ? 'bg-background text-foreground border-b-2 border-naklikam-pink-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Code className="h-4 w-4" />
                Kód & Deploy
              </button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'code' && (
              <div className="h-full">
                <div className="border-b border-border p-3 bg-card">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-naklikam-pink-500" />
                    <h3 className="font-semibold font-display text-foreground">AI Asistent</h3>
                  </div>
                </div>
                <div className="h-[calc(100%-60px)]">
                  <ErrorBoundary>
                    <ChatPanel projectId={currentProject.id} />
                  </ErrorBoundary>
                </div>
              </div>
            )}
            {viewMode === 'deploy' && (
              <div className="h-full p-6 max-w-4xl mx-auto space-y-6">
                <ErrorBoundary>
                  {canAccessDeployment(user) ? (
                    <>
                      <GitHubConnect 
                        onRepositorySelected={(repo) => {
                          console.log('Repository selected:', repo);
                          setSelectedRepository(repo);
                        }}
                      />
                      
                      {selectedRepository && (
                        <VercelConnect 
                          githubRepository={selectedRepository}
                          onProjectCreated={(project) => {
                            console.log('Vercel project created:', project);
                            setVercelProject(project);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <UpgradePrompt 
                      feature="deployment"
                      message={getUpgradeMessage('deployment')}
                    />
                  )}
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Right Area - Code/Preview */}
        <div className="hidden md:flex md:flex-1 md:flex-col">
          {/* Tab Switcher */}
          <div className="border-b border-border bg-card">
            <div className="flex">
              <button
                onClick={() => setViewMode('code')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors hover:bg-background/80 ${
                  viewMode === 'code'
                    ? 'bg-background text-foreground border-b-2 border-naklikam-pink-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Code className="h-4 w-4" />
                Kód
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors hover:bg-background/80 ${
                  viewMode === 'preview'
                    ? 'bg-background text-foreground border-b-2 border-naklikam-pink-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Eye className="h-4 w-4" />
                Náhled
              </button>
              <button
                onClick={() => setViewMode('deploy')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors hover:bg-background/80 ${
                  viewMode === 'deploy'
                    ? 'bg-background text-foreground border-b-2 border-naklikam-pink-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Rocket className="h-4 w-4" />
                Deploy
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              {renderRightPanel()}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Terminal Panel */}
      <TerminalPanel 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)}
        projectId={currentProject.id}
      />

      {/* Project Settings Dialog */}
      {currentProject && (
        <ProjectSettingsDialog 
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          project={currentProject}
        />
      )}
    </div>
  )
}