import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import ReactMarkdown from 'react-markdown'

import { useChatStore } from '@/store/chatStore'
import { useProjectStore } from '@/store/projectStore'
import StructuredMessage from '@/components/StructuredMessage'
import HelpDialog from '@/components/HelpDialog'
import { ModelSelector, type ModelType } from '@/components/ModelSelector'
import { StructuredFile } from '@/types'
import { fileHistoryService } from '@/services/fileHistoryService'
import { projectLock, createOperationLock } from '@/utils/asyncLock'
import { Send, Bot, User, Loader2, Brain, ChevronDown, ChevronRight, HelpCircle, Undo, AlertTriangle } from 'lucide-react'

interface ChatPanelProps {
  projectId: string
}

type ChatMode = 'chat' | 'code'

export default function ChatPanel({ projectId }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelType>('sonnet')
  const [chatMode, setChatMode] = useState<ChatMode>('code') // Default to code mode
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set())
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [showUndoButton, setShowUndoButton] = useState<{ [messageId: string]: boolean }>({})
  const processedFilesRef = useRef<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef<boolean>(false)
  const { 
    currentSession, 
    createSession, 
    sendMessage,
    sendChatMessage, 
    isGenerating, 
    isLoading,
    lastGeneratedFiles, 
    clearGeneratedFiles,
    processingStatus,
    streamingText,
    unsubscribe
  } = useChatStore()
  const { currentProject, addProjectFile, updateProjectFile } = useProjectStore()

  // Initialize chat session and load undo buttons state
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentSession || currentSession.projectId !== projectId) {
        console.log('[ChatPanel] Initializing chat for project:', projectId)
        await createSession(projectId)
      }
      
      // Load existing undo buttons state from history
      if (currentProject && currentProject.id === projectId) {
        const history = fileHistoryService.getChangeHistory(currentProject.id);
        const undoButtons: { [messageId: string]: boolean } = {};
        history.forEach(changeSet => {
          undoButtons[changeSet.messageId] = true;
        });
        setShowUndoButton(undoButtons);
      }
    }
    initializeChat()
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [projectId, currentSession, createSession, unsubscribe, currentProject])

  // Send initial message after both session and project are loaded
  useEffect(() => {
    const sendInitialMessage = async () => {
      // Check for initial prompt from landing page
      const initialPrompt = localStorage.getItem('initialProjectPrompt')
      const initialProjectId = localStorage.getItem('initialProjectId')
      
      if (initialPrompt && initialProjectId === projectId && currentProject && currentSession && currentSession.projectId === projectId) {
        console.log('[ChatPanel] Found initial prompt, sending message:', initialPrompt)
        console.log('[ChatPanel] Current project:', currentProject.name)
        console.log('[ChatPanel] Current session:', currentSession.id)
        
        // Clear the stored values
        localStorage.removeItem('initialProjectPrompt')
        localStorage.removeItem('initialProjectId')
        
        // Prepare project context with images (same as handleSend)
        const imageFiles = currentProject.files.filter(f => 
          f.path.startsWith('/public/images/') && !f.isDirectory
        ) || []
        
        const projectWithImages = {
          ...currentProject,
          uploadedImages: imageFiles.map(f => ({
            name: f.name,
            path: f.path,
            url: f.content // Firebase URL stored in content
          }))
        }
        
        // Send the initial message with enriched context
        console.log(`[ChatPanel] Sending initial message with ${currentProject.files.length} files and ${imageFiles.length} images`)
        await sendMessage(currentSession.id, initialPrompt, projectWithImages)
      }
    }
    
    sendInitialMessage()
  }, [projectId, currentSession, currentProject, sendMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  // Auto-add/update generated files to project with race condition protection
  useEffect(() => {
    if (lastGeneratedFiles && lastGeneratedFiles.length > 0 && currentProject && !processingRef.current) {
      processingRef.current = true
      
      console.log(`[ChatPanel] Processing ${lastGeneratedFiles.length} generated files:`, 
        lastGeneratedFiles.map(f => ({ name: f.name, path: f.path, operation: f.operation, confidence: f.matchConfidence })))
      
      // Create a unique key for this batch of files
      const batchKey = lastGeneratedFiles.map(f => `${f.name}-${f.operation}-${f.existingFileId || 'new'}`).join('|')
      
      // Check if we've already processed this batch
      if (processedFilesRef.current.has(batchKey)) {
        console.log('[ChatPanel] Soubory již zpracovány, přeskakuji...')
        processingRef.current = false
        clearGeneratedFiles()
        return
      }
      
      // Process files with async lock to prevent race conditions
      const processBatch = async () => {
        const lockKey = createOperationLock(currentProject.id, `batch-process-${Date.now()}`)
        
        try {
          await projectLock.withLock(lockKey, async () => {
            console.log(`[ChatPanel] Acquired lock for batch processing: ${lockKey}`)
            
            // Save snapshots of files that will be updated
            const filesToSnapshot = lastGeneratedFiles
              .filter(file => file.operation === 'update' && file.existingFileId)
              .map(file => currentProject.files.find(f => f.id === file.existingFileId))
              .filter((file): file is NonNullable<typeof file> => file !== undefined);

            // Get the latest assistant message ID for linking changes
            const latestAssistantMessage = currentSession?.messages
              .filter(m => m.role === 'assistant')
              .slice(-1)[0];
            
            if (filesToSnapshot.length > 0 && latestAssistantMessage) {
              fileHistoryService.saveChangeSet(
                currentProject.id,
                latestAssistantMessage.id,
                filesToSnapshot,
                `Changes from message`
              );
              
              // Show undo button for this message
              setShowUndoButton(prev => ({ ...prev, [latestAssistantMessage.id]: true }));
            }

            // Process files sequentially to maintain order and avoid conflicts
            for (let i = 0; i < lastGeneratedFiles.length; i++) {
              const file = lastGeneratedFiles[i]
              console.log(`[ChatPanel] Processing file ${i + 1}/${lastGeneratedFiles.length}: ${file.name} (${file.operation})`)
              
              const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
              
              if (file.operation === 'update' && file.existingFileId) {
                // Update existing file
                console.log(`[ChatPanel] Auto-updating existing file: ${file.name} (ID: ${file.existingFileId})`)
                console.log(`[ChatPanel] File content length: ${content.length}`)
                console.log(`[ChatPanel] Match confidence: ${file.matchConfidence}`)
                console.log(`[ChatPanel] File content preview:`, content.substring(0, 100) + '...')
                
                await updateProjectFile(file.existingFileId, content)
                console.log(`[ChatPanel] updateProjectFile completed for ID: ${file.existingFileId}`)
                
              } else {
                // Create new file with duplicate detection handled by projectStore
                console.log(`[ChatPanel] Creating new file: ${file.name} at ${file.path}`)
                
                await addProjectFile({
                  name: file.name,
                  path: file.path,
                  content: content,
                  language: file.language,
                  isDirectory: false
                })
                console.log(`[ChatPanel] addProjectFile completed for: ${file.name}`)
              }
            }
            
            console.log(`[ChatPanel] Batch processing completed successfully`)
          })
          
        } catch (error) {
          console.error('[ChatPanel] Error during batch processing:', error)
        } finally {
          // Mark this batch as processed and clear generated files
          processedFilesRef.current.add(batchKey)
          console.log(`[ChatPanel] Batch processed and marked: ${batchKey}`)
          
          // Clear generated files and reset processing flag
          setTimeout(() => {
            clearGeneratedFiles()
            processingRef.current = false
          }, 100) // Small delay to ensure UI updates first
        }
      }
      
      // Start async processing
      processBatch()
    }
  }, [lastGeneratedFiles, currentProject, addProjectFile, updateProjectFile, currentSession])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentSession || isGenerating) return

    const message = input.trim()
    setInput('')
    
    // Clear any previous generated files and reset processed files
    console.log('[ChatPanel] Clearing previous generated files and resetting processed files')
    clearGeneratedFiles()
    processedFilesRef.current = new Set()
    processingRef.current = false
    
    // Send message with project context including uploaded images
    const imageFiles = currentProject?.files.filter(f => 
      f.path.startsWith('/public/images/') && !f.isDirectory
    ) || []
    
    const projectWithImages = currentProject ? {
      ...currentProject,
      uploadedImages: imageFiles.map(f => ({
        name: f.name,
        path: f.path,
        url: f.content // Firebase URL stored in content
      }))
    } : undefined
    
    console.log(`[ChatPanel] Sending message in ${chatMode} mode with ${currentProject?.files.length || 0} existing files and ${imageFiles.length} uploaded images using ${selectedModel} model`)
    
    // Use appropriate method based on chat mode
    if (chatMode === 'chat') {
      await sendChatMessage(currentSession.id, message, projectWithImages, selectedModel)
    } else {
      await sendMessage(currentSession.id, message, projectWithImages, selectedModel)
    }
  }


  const handleFileAction = (file: StructuredFile, action: 'copy' | 'add' | 'download') => {
    if (!currentProject) return
    
    switch (action) {
      case 'add':
        const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
        if (file.operation === 'update' && file.existingFileId) {
          console.log(`[ChatPanel] Manually updating existing file: ${file.path} (ID: ${file.existingFileId})`)
          updateProjectFile(file.existingFileId, content)
        } else {
          console.log(`[ChatPanel] Manually creating new file: ${file.path}`)
          addProjectFile({
            name: file.path.split('/').pop() || file.path,
            path: file.path,
            content: content,
            language: file.language,
            isDirectory: false
          })
        }
        break
      case 'copy':
        console.log(`Copied file content: ${file.path}`)
        break
      case 'download':
        console.log(`Downloaded file: ${file.path}`)
        break
    }
  }


  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const handleUndo = async (messageId: string) => {
    if (!currentProject) {
      console.error('No current project for undo operation');
      return;
    }

    try {
      const changeSet = fileHistoryService.getChangeSetByMessageId(currentProject.id, messageId);
      if (!changeSet) {
        console.error('No changeset found for message:', messageId);
        return;
      }

      console.log(`Reverting ${changeSet.snapshots.length} files from changeset ${changeSet.id}`);

      // Restore files from snapshots
      for (const snapshot of changeSet.snapshots) {
        // Check if file still exists
        const fileExists = currentProject.files.some(f => f.id === snapshot.fileId);
        if (fileExists) {
          console.log(`Reverting file ${snapshot.path} to previous version`);
          await updateProjectFile(snapshot.fileId, snapshot.content);
        } else {
          console.warn(`File ${snapshot.path} (${snapshot.fileId}) no longer exists, skipping`);
        }
      }

      // Hide undo button for this message
      setShowUndoButton(prev => ({ ...prev, [messageId]: false }));
      
      console.log('Files successfully reverted');
    } catch (error) {
      console.error('Error during undo operation:', error);
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-none">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-4 space-y-3 md:space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Načítám chat...</p>
            </div>
          </div>
        ) : !currentSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Inicializuji chat...</p>
            </div>
          </div>
        ) : currentSession.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold font-display mb-2">Začněte konverzaci</h3>
              <p className="text-sm text-muted-foreground">
                Jsem váš AI asistent připravený pomoci s vývojem. Můžu vytvářet kód, 
                upravovat soubory, řešit problémy a odpovídat na otázky.
              </p>
            </div>
          </div>
        ) : currentSession.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex gap-2 md:gap-3 max-w-[95%] md:max-w-[90%] ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                  : 'bg-purple-500 text-white'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                ) : (
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </div>
              <div
                className={`rounded-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3'
                    : message.isStructured && message.structured
                    ? 'bg-transparent p-0'
                    : 'bg-muted p-3'
                }`}
              >
                {/* Show thinking process for assistant messages */}
                {message.role === 'assistant' && message.hasThinking && message.thinking && (
                  <div className={`mb-3 border-b border-gray-200 pb-3 ${message.isStructured ? 'px-3 pt-3' : ''}`}>
                    <button
                      onClick={() => toggleThinking(message.id)}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 mb-2"
                    >
                      <Brain className="h-3 w-3" />
                      <span>Proces myšlení AI</span>
                      {expandedThinking.has(message.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                    
                    {expandedThinking.has(message.id) && (
                      <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 max-h-40 overflow-y-auto">
                        <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.thinking}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Render structured, chat, or traditional message */}
                {message.role === 'assistant' && message.isChat ? (
                  /* Chat mode response - simple markdown display */
                  <div className="text-sm break-words overflow-wrap-anywhere">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-gradient-to-r from-naklikam-pink-500 to-naklikam-pink-600 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">💬 Chat odpověď</span>
                    </div>
                    <ReactMarkdown 
                      components={{
                        // Style links to match app theme
                        a: ({ children, href }) => (
                          <a 
                            href={href} 
                            className="text-purple-600 hover:text-purple-800 underline font-medium"
                            target={href?.startsWith('http') ? '_blank' : undefined}
                            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {children}
                          </a>
                        ),
                        // Style code blocks
                        code: ({ children, className }) => (
                          <code 
                            className={`${className || ''} bg-gray-100 px-1 py-0.5 rounded text-sm font-mono`}
                          >
                            {children}
                          </code>
                        ),
                        // Style pre blocks (code blocks)
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-2">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2)}
                    </ReactMarkdown>
                  </div>
                ) : message.role === 'assistant' && message.isStructured && message.structured ? (
                  /* Code generation response - structured display */
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-gradient-to-r from-naklikam-purple-500 to-naklikam-purple-600 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">🔧 Kódová odpověď</span>
                    </div>
                    <StructuredMessage 
                      response={message.structured}
                      onFileAction={handleFileAction}
                      onAddAllFiles={() => {
                      if (message.structured?.files) {
                        message.structured.files.forEach(file => {
                          handleFileAction(file, 'add')
                        })
                      }
                    }}
                  />
                  </>
                ) : (
                  <>
                    <div className="text-sm break-words overflow-wrap-anywhere">
                      {typeof message.content === 'string' ? (
                        <ReactMarkdown 
                          components={{
                            // Style links to match app theme
                            a: ({ children, href }) => (
                              <a 
                                href={href} 
                                className="text-purple-600 hover:text-purple-800 underline font-medium"
                                target={href?.startsWith('http') ? '_blank' : undefined}
                                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {children}
                              </a>
                            ),
                            // Style strong/bold text
                            strong: ({ children }) => (
                              <strong className="font-bold text-foreground">{children}</strong>
                            ),
                            // Style lists
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-sm">{children}</li>
                            ),
                            // Style paragraphs
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            )
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        JSON.stringify(message.content, null, 2)
                      )}
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Undo button for messages that changed files */}
            {message.role === 'assistant' && showUndoButton[message.id] && (
              <div className="ml-12 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUndo(message.id)}
                  className="text-xs flex items-center gap-1"
                >
                  <Undo className="h-3 w-3" />
                  Vrátit změny souborů
                </Button>
              </div>
            )}
          </div>
        ))}
        {/* Show generating indicator - Naklikam Brand Style */}
        {isGenerating && (
          <div className="flex gap-2 md:gap-3 justify-start">
            <div className="flex gap-2 md:gap-3 max-w-[95%] md:max-w-[90%]">
              <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg">
                <Bot className="h-3 w-3 md:h-4 md:w-4" />
              </div>
              <div className="rounded-2xl p-3 md:p-4 bg-gradient-to-br from-white to-gray-50/50 border border-pink-200/60 shadow-lg backdrop-blur-sm">
                <div className={`flex items-center gap-3 mb-3 ${
                  processingStatus?.includes('⚠️') ? 'p-3 bg-amber-50 rounded-lg border border-amber-200' :
                  processingStatus?.includes('❌') ? 'p-3 bg-red-50 rounded-lg border border-red-200' :
                  processingStatus?.includes('🔒') || processingStatus?.includes('📡') ? 'p-3 bg-blue-50 rounded-lg border border-blue-200' :
                  ''
                }`}>
                  {!processingStatus?.includes('⚠️') && !processingStatus?.includes('❌') && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <span className={`text-sm font-medium font-display ${
                    processingStatus?.includes('⚠️') ? 'text-amber-700' :
                    processingStatus?.includes('❌') ? 'text-red-700' :
                    processingStatus?.includes('🔒') || processingStatus?.includes('📡') ? 'text-blue-700' :
                    'text-gray-700'
                  }`}>
                    {processingStatus || 'AI přemýšlí...'}
                  </span>
                </div>
                
                {/* Show live streaming text - Naklikam Style */}
                {streamingText && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200/50">
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-600 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse shadow-sm" />
                      <span className="font-display">Claude píše v reálném čase</span>
                      <div className="flex-1 border-t border-dashed border-pink-300/50"></div>
                      <span className="text-pink-600 font-semibold">{streamingText.length} znaků</span>
                    </div>
                    <div className="relative">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto border border-white/80 rounded-lg p-3 bg-white/90 backdrop-blur-sm font-mono leading-relaxed">
                        {streamingText.slice(-1200)}{streamingText.length > 1200 && '...'}
                        <span className="inline-block w-0.5 h-4 bg-gradient-to-r from-pink-500 to-purple-500 animate-pulse ml-1 rounded-full"></span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>
                )}
                
                {/* Progress bar - Naklikam Style */}
                {processingStatus && processingStatus.includes('%') && (() => {
                  const match = processingStatus.match(/(\d+)%/);
                  const percentage = match ? parseInt(match[1]) : 0;
                  return (
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      
      <div className="border-t p-3 md:p-4">
        <form onSubmit={handleSend} className="space-y-2">
          {/* Chat Mode Selector */}
          <div className="mb-2 md:mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-naklikam-gray-600 font-medium">Režim:</span>
              <div className="flex rounded-lg bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setChatMode('chat')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    chatMode === 'chat'
                      ? 'bg-naklikam-gradient text-white shadow-lg shadow-naklikam-pink-500/20'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  type="button"
                  onClick={() => setChatMode('code')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    chatMode === 'code'
                      ? 'bg-naklikam-gradient text-white shadow-lg shadow-naklikam-purple-500/20'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🔧 Kódování
                </button>
              </div>
            </div>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isGenerating || !currentSession || isLoading}
            />
          </div>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder={isGenerating ? "Generuji odpověď..." : !currentSession ? "Načítám chat..." : "Napište co chcete vytvořit, opravit nebo vysvětlit..."}
              className="w-full px-2 py-2 md:px-3 border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              rows={2}
              disabled={isGenerating || !currentSession || isLoading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {input.length}/500
            </div>
          </div>
          
          {/* Long prompt warning */}
          {input.length > 500 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Dlouhý prompt ({input.length} znaků)</p>
                <p className="text-xs mt-1">
                  AI pracuje lépe s kratšími a strukturovanými prompty. Zkuste rozdělit požadavek na menší části nebo být konkrétnější.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHelpDialog(true)}
              className="text-xs text-muted-foreground hover:text-foreground min-h-[36px] md:min-h-[32px]"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Nápověda</span>
            </Button>
            <Button type="submit" disabled={!input.trim() || isGenerating || !currentSession || isLoading} size="sm" className="min-h-[36px] md:min-h-[32px]">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <HelpDialog 
        open={showHelpDialog} 
        onOpenChange={setShowHelpDialog} 
      />
    </div>
  )
}