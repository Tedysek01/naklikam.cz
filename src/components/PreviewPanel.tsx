import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

import { useProjectStore } from '@/store/projectStore'
import { containerService } from '@/services/ContainerService'
import { 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Home
} from 'lucide-react'

export default function PreviewPanel() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detailedError, setDetailedError] = useState<{type: string, message: string, solution: string, fullError?: string} | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { currentProject } = useProjectStore()
  const lastProjectIdRef = useRef<string | null>(null)
  const initializationInProgress = useRef(false)
  const isInitialized = useRef(false)
  const lastFileUpdateTime = useRef<string | null>(null)
  const hotReloadInProgress = useRef(false)

  // Check for container errors
  useEffect(() => {
    const checkErrors = setInterval(() => {
      const errorData = localStorage.getItem('webcontainer-error')
      if (errorData) {
        try {
          const error = JSON.parse(errorData)
          if (Date.now() - error.timestamp < 5000) {
            setDetailedError(error)
            setError(error.message)
            localStorage.removeItem('webcontainer-error')
          }
        } catch (e) {
          console.error('Failed to parse error data:', e)
        }
      }
    }, 1000)

    return () => clearInterval(checkErrors)
  }, [])

  useEffect(() => {
    if (!currentProject) return
    
    // Only initialize when project actually changes or when first mounting
    const projectChanged = lastProjectIdRef.current !== currentProject.id
    const needsInitialization = !isInitialized.current || projectChanged
    
    if (needsInitialization && !initializationInProgress.current) {
      console.log('[PreviewPanel] Initializing container:', {
        projectChanged,
        isFirstInit: !isInitialized.current,
        currentProjectId: currentProject.id,
        lastProjectId: lastProjectIdRef.current
      })
      lastProjectIdRef.current = currentProject.id
      
      // Add small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        if (!initializationInProgress.current) {
          initializeContainer()
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [currentProject?.id])

  // Hot reload effect - watches for file changes after initialization
  useEffect(() => {
    if (!currentProject || !isInitialized.current || !previewUrl || hotReloadInProgress.current) {
      return
    }

    // Check if files have been updated (e.g., after Claude response)
    const currentUpdateTime = currentProject.updatedAt
    if (currentUpdateTime && currentUpdateTime !== lastFileUpdateTime.current) {
      console.log('[PreviewPanel] Files updated, triggering hot reload:', {
        previousTime: lastFileUpdateTime.current,
        currentTime: currentUpdateTime
      })
      
      const previousTime = lastFileUpdateTime.current
      lastFileUpdateTime.current = currentUpdateTime
      
      // Only trigger hot reload if we had a previous time (not initial load)
      if (previousTime !== null) {
        performHotReload()
      }
    }
  }, [currentProject?.updatedAt, previewUrl])

  const performHotReload = async () => {
    if (hotReloadInProgress.current || !currentProject || !previewUrl) {
      return
    }

    hotReloadInProgress.current = true
    console.log('[PreviewPanel] Starting hot reload without dependency reinstall')
    
    try {
      // Update files in WebContainer without reinstalling dependencies
      for (const file of currentProject.files) {
        if (!file.isDirectory && file.content !== undefined) {
          try {
            await containerService.writeFile(file.path, file.content, currentProject.id)
            console.log(`[PreviewPanel] Updated file: ${file.path}`)
          } catch (error) {
            console.warn(`[PreviewPanel] Failed to update file ${file.path}:`, error)
          }
        }
      }
      
      // Force iframe refresh to see changes
      if (iframeRef.current) {
        setIsRefreshing(true)
        // Small delay to ensure files are written
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = iframeRef.current.src
          }
          setTimeout(() => setIsRefreshing(false), 1000)
        }, 100)
      }
      
      console.log('[PreviewPanel] Hot reload completed successfully')
    } catch (error) {
      console.error('[PreviewPanel] Hot reload failed:', error)
      // Don't show error to user for hot reload failures - they can manually refresh
    } finally {
      hotReloadInProgress.current = false
    }
  }

  
  const initializeContainer = async () => {
    if (initializationInProgress.current) {
      console.log('[PreviewPanel] Initialization already in progress, skipping')
      return
    }

    initializationInProgress.current = true
    setIsLoading(true)
    setLoadingMessage('Připravuji vývojové prostředí...')
    setError(null)
    setPreviewUrl(null)
    
    try {
      console.log('[PreviewPanel] Starting container initialization...')
      
      // Setup all project files at once using new mount() API
      if (currentProject?.files && currentProject.files.length > 0) {
        console.log('[PreviewPanel] Setting up project with', currentProject.files.length, 'files')
        setLoadingMessage('Nahrávám soubory projektu...')
        
        // Log package.json specifically
        const packageJsonFile = currentProject.files.find(f => f.name === 'package.json' || f.path === '/package.json')
        if (packageJsonFile) {
          console.log('[PreviewPanel] Found package.json:', {
            name: packageJsonFile.name,
            path: packageJsonFile.path,
            contentLength: packageJsonFile.content?.length,
            contentPreview: packageJsonFile.content?.substring(0, 200)
          })
        } else {
          console.warn('[PreviewPanel] No package.json found in project files!')
          console.log('[PreviewPanel] Available files:', currentProject.files.map(f => ({ name: f.name, path: f.path })))
        }
        
        // Setup project and check if dependencies need to be installed  
        const needsDependencyInstall = await containerService.setupProject(currentProject.files, currentProject.id)
        
        if (needsDependencyInstall) {
          // Install dependencies only if package.json changed or it's first setup
          console.log('[PreviewPanel] Installing dependencies...')
          setLoadingMessage('Instaluji knihovny a závislosti...')
          await containerService.installDependencies(currentProject.id)
        } else {
          console.log('[PreviewPanel] Skipping dependency installation - package.json unchanged')
        }
        
        // Start dev server
        console.log('[PreviewPanel] Starting dev server...')
        setLoadingMessage('Spouštím vývojový server...')
        const url = await containerService.startDevServer(currentProject.id)
        
        if (url) {
          console.log('[PreviewPanel] Dev server ready at:', url)
          setPreviewUrl(url)
          setCurrentUrl(url)
          
          // Initialize file update time tracking
          lastFileUpdateTime.current = currentProject.updatedAt || null
          console.log('[PreviewPanel] Initialized file update time tracking:', lastFileUpdateTime.current)
        } else {
          throw new Error('Nepodařilo se spustit vývojový server')
        }
      } else {
        console.log('[PreviewPanel] No files in project')
        setError('V projektu nejsou žádné soubory k zobrazení')
      }
    } catch (err) {
      console.error('[PreviewPanel] Container error:', err)
      setError(`Chyba náhledu: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
      initializationInProgress.current = false
      isInitialized.current = true
    }
  }

  // Hot reload when files change (after initial setup)
  useEffect(() => {
    if (!currentProject || !isInitialized.current || initializationInProgress.current) return;
    
    // Simple debounced file change detection
    if (!hotReloadInProgress.current && currentProject.files.length > 0) {
      hotReloadInProgress.current = true;
      
      setTimeout(async () => {
        try {
          // Prepare file updates
          const fileUpdates = currentProject.files.map(file => ({
            path: file.path,
            content: file.content
          }));
          
          console.log(`[PreviewPanel] Hot reloading ${fileUpdates.length} files...`);
          await containerService.updateFiles(fileUpdates, currentProject.id);
          
          console.log('[PreviewPanel] Hot reload completed successfully');
        } catch (error) {
          console.error('[PreviewPanel] Hot reload failed:', error);
          // Don't break the app, just log the error
        } finally {
          hotReloadInProgress.current = false;
        }
      }, 2000); // 2 second debounce
    }
  }, [currentProject?.files]);

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      setIsRefreshing(true)
      iframeRef.current.src = iframeRef.current.src
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }
  
  const handleRestartContainer = () => {
    if (!currentProject) return
    
    // Force re-initialization by resetting initialization state
    isInitialized.current = false
    initializeContainer()
  }

  const handleNavigateBack = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.history.back()
      }
    } catch {
      // Cross-origin — navigation not available
    }
  }

  const handleNavigateForward = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.history.forward()
      }
    } catch {
      // Cross-origin — navigation not available
    }
  }

  const handleNavigateHome = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl
      setCurrentUrl(previewUrl)
    }
  }


  const handleUrlChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && iframeRef.current) {
      const input = e.currentTarget
      let url = input.value
      
      // If URL doesn't start with http, add the base preview URL
      if (!url.startsWith('http')) {
        const base = previewUrl?.replace(/\/$/, '') || ''
        url = `${base}/${url.replace(/^\//, '')}`
      }
      
      iframeRef.current.src = url
    }
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display mb-2 text-red-600">Chyba náhledu</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              {error === 'V projektu nejsou žádné soubory k zobrazení' ? 'V projektu nejsou žádné soubory k zobrazení' : error}
            </p>
            
            {detailedError && (
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4 max-w-2xl mx-auto text-left shadow-lg">
                <h4 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                  Automatické řešení:
                </h4>
                <p className="text-slate-300 text-sm mb-3">{detailedError.solution}</p>

                {detailedError.fullError && (
                  <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
                    <h5 className="font-medium text-orange-300 mb-2 flex items-center gap-2">
                      Kompletní error log pro Claude:
                    </h5>
                    <div className="relative">
                      <pre className="text-xs text-red-300 bg-slate-950 p-2 rounded border border-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                        {detailedError.fullError}
                      </pre>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(detailedError.fullError || '')
                          alert('Error log zkopírován do schránky! Můžete jej vložit do chatu s Claudem.')
                        }}
                        size="sm"
                        variant="outline"
                        className="absolute top-1 right-1 h-6 px-2 text-xs bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600"
                      >
                        Kopírovat
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => setDetailedError(null)}
                    size="sm"
                    variant="outline"
                    className="border-slate-500 text-slate-300 hover:bg-slate-700"
                  >
                    Zavřít
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Button onClick={initializeContainer} size="sm">
                Zkusit znovu
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Pokud náhled zamrzl, zkuste tlačítko restart v panelu nástrojů
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center max-w-md">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold font-display mb-2">Připravuji náhled aplikace</h3>
            <p className="text-muted-foreground text-sm mb-2">
              {loadingMessage || 'Vytvářím vývojové prostředí pro váš projekt...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {loadingMessage.includes('Instaluji') ? 
                'Při první instalaci se stahují všechny potřebné knihovny. Příště to bude mnohem rychlejší!' :
                'Prosím počkejte, připravuji prostředí pro váš projekt...'
              }
            </p>
          </div>
        </div>
      )
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold font-display mb-2">Připraveno k náhledu</h3>
            <p className="text-muted-foreground mb-4">
              {currentProject?.files?.length ? 
                'Inicializuji vývojové prostředí...' : 
                'Přidejte soubory do projektu pro zobrazení náhledu'
              }
            </p>
            {currentProject?.files?.length && !isLoading && (
              <Button onClick={initializeContainer} size="sm">
                Spustit náhled
              </Button>
            )}
          </div>
        </div>
      )
    }

    return (
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="w-full h-full border-0 bg-white"
        title="Náhled aplikace"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation"
        onLoad={() => {
          // Set HMR target for live reload
          try {
            if (iframeRef.current?.contentWindow) {
              containerService.setHMRTarget(iframeRef.current.contentWindow)
            }
            const url = iframeRef.current?.contentWindow?.location.href
            if (url) setCurrentUrl(url)
          } catch (e) {
            // Cross-origin, can't access URL
          }
        }}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Navigation Bar */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-2 p-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateBack}
              disabled={!previewUrl}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateForward}
              disabled={!previewUrl}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={!previewUrl || isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateHome}
              disabled={!previewUrl}
              className="h-8 w-8 p-0"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>

          {/* URL Bar */}
          <input
            type="text"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={handleUrlChange}
            placeholder="Enter URL..."
            className="flex-1 h-8 px-3 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!previewUrl}
          />

          <div className="flex items-center gap-1">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="rounded-r-none h-8"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="rounded-l-none border-l h-8"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestartContainer}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Restartovat náhled (použijte pokud náhled zamrzl)"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-muted/50 border-b border-border px-3 py-2">
        <p className="text-xs text-muted-foreground text-center">
          V případě erroru, nebo nenačtení náhledu zkopírujte chybovou hlášku z náhledu nebo webové konzole (F12 - console) a vložte do chatu
        </p>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-gray-100 overflow-hidden">
        <div
          className={`transition-all duration-300 h-full ${
            viewMode === 'mobile'
              ? 'flex items-center justify-center p-4'
              : ''
          }`}
        >
          <div
            className={`${
              viewMode === 'mobile'
                ? 'w-[375px] h-[667px] rounded-[20px] border-8 border-gray-800 overflow-hidden'
                : 'w-full h-full'
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}