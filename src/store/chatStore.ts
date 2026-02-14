import { create } from 'zustand'
import { ChatSession, ChatMessage } from '@/types'
import { claudeService, CodeGenerationResponse } from '@/services/ClaudeService'
import { chatService } from '@/services/firebaseService'
import { useAuthStore } from '@/store/authStore'
import { subscriptionService } from '@/services/subscriptionService'
import { trackAIPromptSubmitted } from '@/utils/analytics'

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isGenerating: boolean
  isLoading: boolean
  error: string | null
  lastGeneratedFiles: CodeGenerationResponse['suggestedFiles']
  processingStatus: string | null
  streamingText: string | null
  unsubscribeMessages: (() => void) | null
  loadSession: (sessionId: string) => Promise<void>
  createSession: (projectId: string) => Promise<void>
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>
  sendMessage: (sessionId: string, content: string, projectContext?: any, model?: 'sonnet' | 'haiku') => Promise<void>
  sendChatMessage: (sessionId: string, content: string, projectContext?: any, model?: 'sonnet' | 'haiku') => Promise<void>
  clearGeneratedFiles: () => void
  setProcessingStatus: (status: string | null) => void
  clearError: () => void
  subscribeToMessages: (sessionId: string) => void
  unsubscribe: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  isGenerating: false,
  isLoading: false,
  error: null,
  lastGeneratedFiles: [],
  processingStatus: null,
  streamingText: null,
  unsubscribeMessages: null,
  
  loadSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const session = await chatService.getSession(sessionId)
      if (session) {
        set(state => ({
          currentSession: session,
          sessions: state.sessions.some(s => s.id === session.id) 
            ? state.sessions.map(s => s.id === session.id ? session : s)
            : [...state.sessions, session],
          isLoading: false
        }))
      } else {
        set({ error: 'Session not found', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  createSession: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[ChatStore] Creating/loading session for project:', projectId)
      
      // First check if session already exists for this project
      const existingSessions = await chatService.getSessionsByProject(projectId)
      console.log('[ChatStore] Found existing sessions:', existingSessions.length)
      
      if (existingSessions.length > 0) {
        // Load the most recent existing session with messages
        const latestSession = existingSessions[0]
        console.log('[ChatStore] Loading existing session:', latestSession.id)
        
        const messages = await chatService.getMessages(latestSession.id)
        console.log('[ChatStore] Loaded messages:', messages.length)
        
        const sessionWithMessages = { ...latestSession, messages }
        
        set(state => ({
          sessions: state.sessions.some(s => s.id === latestSession.id) 
            ? state.sessions.map(s => s.id === latestSession.id ? sessionWithMessages : s)
            : [...state.sessions, sessionWithMessages],
          currentSession: sessionWithMessages,
          isLoading: false
        }))
        
        // Subscribe to real-time updates
        get().subscribeToMessages(latestSession.id)
      } else {
        // Create new session if none exists
        console.log('[ChatStore] Creating new session for project:', projectId)
        const newSession = await chatService.createSession(projectId)
        console.log('[ChatStore] Created new session:', newSession.id)
        
        set(state => ({
          sessions: [...state.sessions, newSession],
          currentSession: newSession,
          isLoading: false
        }))
        
        // Subscribe to real-time updates
        get().subscribeToMessages(newSession.id)
      }
    } catch (error: any) {
      console.error('[ChatStore] Error in createSession:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  addMessage: async (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    try {
      const messageId = await chatService.addMessage(sessionId, message)
      
      const newMessage: ChatMessage = {
        ...message,
        id: messageId,
        timestamp: new Date().toISOString()
      }
      
      set(state => {
        const updatedSessions = state.sessions.map(session =>
          session.id === sessionId
            ? { ...session, messages: [...session.messages, newMessage] }
            : session
        )
        
        const updatedCurrentSession = state.currentSession?.id === sessionId
          ? { ...state.currentSession, messages: [...state.currentSession.messages, newMessage] }
          : state.currentSession
        
        return {
          sessions: updatedSessions,
          currentSession: updatedCurrentSession
        }
      })
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  
  sendMessage: async (sessionId: string, content: string, projectContext?: any, model: 'sonnet' | 'haiku' = 'sonnet') => {
    const { addMessage } = get()
    
    // Add user message
    await addMessage(sessionId, { role: 'user', content })
    
    // Track AI prompt submission
    trackAIPromptSubmitted(model)
    
    // Cycling Czech status messages
    const statusMessages = [
      'Připravuji kontext...',
      'Analyzuji váš požadavek...',
      'Odesílám do AI...',
      'AI zpracovává odpověď...',
      'Generuji kód...',
      'Finalizuji výsledek...'
    ]
    
    let currentStatusIndex = 0
    
    // Set generating state with first message
    set({ isGenerating: true, processingStatus: statusMessages[0], streamingText: null })
    
    // Start cycling through status messages
    const statusInterval = setInterval(() => {
      currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length
      set({ processingStatus: statusMessages[currentStatusIndex] })
    }, 2000) // Change every 2 seconds
    
    try {
      // Prepare context for Claude - use ACTUAL current project files
      const currentFiles = projectContext?.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
        content: file.content,
        language: file.language,
        path: file.path
      })) || []
      
      // Get conversation context from last 3 messages (excluding the just-added user message)
      const currentSession = get().currentSession
      const conversationContext = currentSession?.messages ? 
        currentSession.messages
          .slice(-4, -1) // Get last 4 messages, excluding the newest one (just added user message)
          .slice(-3)     // Take only last 3 for context
          .map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            timestamp: msg.timestamp
          })) : []
      
      console.log('Sending context to AI:', {
        projectName: projectContext?.name,
        filesCount: currentFiles.length,
        fileNames: currentFiles.map((f: any) => f.name),
        fileIds: currentFiles.map((f: any) => ({ name: f.name, id: f.id })),
        conversationContextCount: conversationContext.length,
        conversationContext: conversationContext.map(msg => ({
          role: msg.role,
          contentPreview: typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : '[Structured Response]',
          timestamp: msg.timestamp
        }))
      })
      
      // Get current user ID
      const userId = useAuthStore.getState().user?.id
      
      if (!userId) {
        throw new Error('Musíte být přihlášeni pro použití AI')
      }
      
      // Check if user has enough tokens
      const estimatedTokens = Math.max(content.length * 4, 5000) // Rough estimate: 4 tokens per character, min 5000
      const hasTokens = await subscriptionService.hasEnoughTokens(userId, estimatedTokens)
      
      if (!hasTokens) {
        clearInterval(statusInterval)
        throw new Error('Nemáte dostatek tokenů. Prosím, upgradujte váš plán.')
      }
      
      // Try streaming for long requests, fallback to regular if needed
      console.log(`[ChatStore] Sending request to Claude service using ${model} model...`)
      
      // Update processing status with progress
      let lastProgress = 0
      const progressInterval = setInterval(() => {
        lastProgress += 5
        if (lastProgress <= 90) {
          set({ processingStatus: `Generuji odpověd... (${lastProgress}%)` })
        }
      }, 2000)
      
      let response: CodeGenerationResponse | undefined
      
      try {
        // Try streaming first for better user experience
        console.log('[ChatStore] Starting streaming API call...')
        response = await claudeService.generateCodeWithStreaming({
          prompt: content,
          projectContext: projectContext?.name ? `Project: ${projectContext.name} - ${projectContext.description}` : undefined,
          currentFiles,
          uploadedImages: projectContext?.uploadedImages,
          conversationContext,
          userId,
          model
        }, (update) => {
          // Handle different types of streaming updates
          console.log('[ChatStore] Streaming update received:', update);
          if (update.type === 'streaming') {
            // Real-time character streaming - show what Claude is actually writing
            const charCount = update.partialContent?.length || 0;
            set({ 
              processingStatus: `Claude píše... (${charCount} znaků)`,
              streamingText: update.partialContent || null
            })
          } else if (update.type === 'progress') {
            if (update.message && update.progress) {
              set({ processingStatus: `${update.message} (${update.progress}%)` })
            } else if (update.message) {
              set({ processingStatus: update.message })
            }
          } else if (update.type === 'warning') {
            // Show warning message to user
            if (update.message) {
              set({ processingStatus: update.message })
            }
          } else if (update.type === 'complete') {
            console.log('[ChatStore] Streaming completed successfully')
          }
        })
        
        // If we got here with a valid response, streaming was successful
        if (response && response.content) {
          console.log('[ChatStore] Streaming API completed successfully, no fallback needed')
        } else {
          throw new Error('Streaming completed but no valid response received')
        }
        
      } catch (streamError: any) {
        console.log('[ChatStore] Streaming error:', streamError?.message || streamError)
        
        // Check if we already have a valid response from streaming
        if (response && response.content) {
          console.log('[ChatStore] Streaming produced valid response despite error, not using fallback')
          // Don't use fallback, we have a valid response
        } else {
          console.log('[ChatStore] No valid response from streaming, using fallback')
          set({ processingStatus: 'Streaming se nezdařil, přepínám na standardní API...' })
          
          // Use fallback only if we don't have a valid response
          try {
            response = await claudeService.generateCode({
              prompt: content,
              projectContext: projectContext?.name ? `Project: ${projectContext.name} - ${projectContext.description}` : undefined,
              currentFiles,
              uploadedImages: projectContext?.uploadedImages,
              conversationContext,
              userId,
              model
            })
            console.log('[ChatStore] Fallback API completed successfully')
          } catch (fallbackError: any) {
            console.error('[ChatStore] Both streaming and fallback failed:', fallbackError)
            throw fallbackError
          }
        }
      } finally {
        clearInterval(progressInterval)
        set({ processingStatus: null })
      }
      
      // TypeScript guard - ensure response exists
      if (!response) {
        throw new Error('No response received from AI service')
      }
      
      console.log('[ChatStore] Received response from Claude:', {
        hasContent: !!response.content,
        contentLength: response.content?.length,
        isStructured: response.isStructured,
        hasThinking: response.hasThinking,
        suggestedFilesCount: response.suggestedFiles?.length
      })
      
      // Clear the status cycling
      clearInterval(statusInterval)
      
      // Check if response contains error messages - if so, don't consume tokens
      const isErrorResponse = response.content?.includes('Nepodařilo se ověřit předplatné') || 
                              response.content?.includes('Předplatné je vyžadováno') ||
                              response.content?.includes('Předplatné není aktivní') ||
                              response.content?.includes('Pro použití AI je potřeba placené předplatné') ||
                              response.content?.includes('Vyčerpáno tokenů') ||
                              response.content?.includes('subscription error') ||
                              response.content?.includes('authentication required')
      
      if (isErrorResponse) {
        console.warn('[ChatStore] Response contains error message - not consuming tokens')
        
        // Add assistant error message
        await addMessage(sessionId, { 
          role: 'assistant', 
          content: response.content
        })
        console.log('[ChatStore] Error message added to session')
        return
      }
      
      // Only consume tokens for successful responses
      let baseTokens = 10000; // Fallback minimum
      
      if (response.usage && response.usage.input_tokens && response.usage.output_tokens) {
        baseTokens = response.usage.input_tokens + response.usage.output_tokens;
      } else {
        // Fallback to estimation
        baseTokens = Math.max(
          (content.length + response.content.length) * 4,
          10000
        );
      }
      
      // Calculate actual cost based on model and apply margin (1.5x for free, 2.5x for paid)
      let actualTokens;
      
      // Get user plan to determine margin
      const userPlan = useAuthStore.getState().user?.subscription?.plan;
      const marginMultiplier = userPlan === 'free' ? 1.5 : 2.0;
      
      if (response.usage && response.usage.input_tokens && response.usage.output_tokens) {
        let inputCost, outputCost;
        
        if (model === 'haiku') {
          inputCost = 0.80; // $0.80 per 1M tokens
          outputCost = 4.00; // $4.00 per 1M tokens
        } else { // sonnet
          inputCost = 3.00; // $3.00 per 1M tokens  
          outputCost = 15.00; // $15.00 per 1M tokens
        }
        
        const realCostDollars = (response.usage.input_tokens * inputCost / 1000000) + (response.usage.output_tokens * outputCost / 1000000);
        const costWithMargin = realCostDollars * marginMultiplier;
        
        // Convert back to "user tokens" at average rate of ~$9/1M tokens
        actualTokens = Math.round(costWithMargin * 1000000 / 9);
        
      } else {
        // Fallback to simple token counting
        actualTokens = Math.round(baseTokens * marginMultiplier);
      }
      
      try {
        await subscriptionService.consumeTokens(userId, actualTokens)
        
        // Update user's subscription info in auth store
        const updatedSubscription = await subscriptionService.getSubscription(userId)
        if (updatedSubscription) {
          useAuthStore.getState().updateSubscription(updatedSubscription)
        }
      } catch (error) {
        console.error('Error consuming tokens:', error)
        // Don't fail the request if token consumption fails
      }
      
      // Add assistant response
      console.log('[ChatStore] Adding assistant message to session:', sessionId)
      await addMessage(sessionId, { 
        role: 'assistant', 
        content: response.content,
        thinking: response.thinking,
        hasThinking: response.hasThinking,
        structured: response.structured,
        isStructured: response.isStructured
      })
      console.log('[ChatStore] Assistant message added successfully')
      
      // Store generated files for potential use - prioritize structured response files
      if (response.isStructured && response.structured?.files) {
        // Use the properly processed files from ClaudeService that include existingFileId
        console.log('[ChatStore] Using processed files from ClaudeService:', response.suggestedFiles?.length || 0, 'files')
        if (response.suggestedFiles && response.suggestedFiles.length > 0) {
          console.log('[ChatStore] Processed files with operations:', response.suggestedFiles.map(f => ({
            name: f.name,
            operation: f.operation,
            existingFileId: f.existingFileId,
            matchConfidence: f.matchConfidence
          })))
          set({ lastGeneratedFiles: response.suggestedFiles })
        } else {
          // Fallback: Convert structured files to legacy format for compatibility
          const legacyFiles = response.structured.files.map(file => ({
            name: file.path.split('/').pop() || file.path,
            content: file.content,
            language: file.language,
            path: file.path,
            operation: file.operation as 'create' | 'update',
            existingFileId: file.existingFileId,
            matchConfidence: file.matchConfidence,
            matchReasons: file.matchReasons
          }))
        
        console.log('Storing structured files:', legacyFiles.map(f => ({
          name: f.name,
          operation: f.operation,
          existingFileId: f.existingFileId,
          matchConfidence: f.matchConfidence
          })))
          set({ lastGeneratedFiles: legacyFiles })
        }
      } else if (response.suggestedFiles && response.suggestedFiles.length > 0) {
        console.log('Storing legacy generated files:', response.suggestedFiles.map(f => ({
          name: f.name,
          operation: f.operation,
          existingFileId: f.existingFileId,
          matchConfidence: f.matchConfidence
        })))
        set({ lastGeneratedFiles: response.suggestedFiles })
      }
      
    } catch (error: any) {
      // Clear the status cycling
      clearInterval(statusInterval)
      console.error('Error generating response:', error)
      
      let errorMessage = 'Omlouvám se, ale při generování odpovědi došlo k chybě. Zkuste to prosím znovu nebo zkontrolujte konfiguraci API.'
      
      // Get user plan for better error messages
      const userPlan = useAuthStore.getState().user?.subscription?.plan;
      
      // Handle subscription errors
      if (error.message?.includes('Subscription required') || error.message?.includes('subscription=') || error.message?.includes('User authentication required')) {
        errorMessage = '🚀 Pro používání Naklikam.cz je potřeba aktivní předplatné.\n\n✨ Doporučujeme **Professional plán** (1 290 Kč/měsíc) - nejlepší poměr cena/výkon:\n• **5 milionů tokenů** měsíčně (~250 AI generací)\n• **Zobrazení a úpravy kódu**\n• **GitHub integrace + deployment**\n• **Automatické nasazení na Vercel**\n• **Stažení projektů jako ZIP**\n\n👉 [Vybrat předplatné](/subscription)'
      } else if (error.message?.includes('Token limit exceeded') || error.message?.includes('Insufficient tokens') || error.message?.includes('limit') || error.message?.includes('Nemáte dostatek tokenů')) {
        if (userPlan === 'free') {
          errorMessage = '🚀 Pro používání Naklikam.cz je potřeba aktivní předplatné.\n\n✨ Doporučujeme **Trial plán** (70 Kč/měsíc) pro vyzkoušení:\n• **100 tisíc tokenů** měsíčně (~5 generací)\n• **Deploy na Vercel**\n• **Download projektů**\n\nNebo **Professional plán** (1 290 Kč/měsíc) pro seriózní práci:\n• **5 milionů tokenů** měsíčně (~250 AI generací)\n\n👉 [Vybrat předplatné](/subscription)'
        } else if (userPlan === 'trial') {
          errorMessage = '🎯 Spotřebovali jste svých **100 tisíc tokenů** z Trial plánu!\n\n✨ Doporučujeme **Professional plán** (1 290 Kč/měsíc) pro pokračování:\n• **5 milionů tokenů** měsíčně (50x více!)\n• **GitHub integrace + deployment**\n• **Automatické nasazení na Vercel**\n• **Prioritní generování**\n\n👉 [Upgrade na Professional](/subscription)'
        } else if (userPlan === 'starter') {
          errorMessage = '⚡ Spotřebovali jste svých **2 miliony tokenů** z Starter plánu!\n\n🚀 Upgradujte na **Professional plán** (1 290 Kč/měsíc) a získejte:\n• **5 milionů tokenů** měsíčně (2.5x více!)\n• **GitHub integrace + deployment**\n• **Automatické nasazení na Vercel**\n• **Prioritní generování**\n\n👉 [Upgrade na Professional](/subscription)'
        } else if (userPlan === 'professional') {
          errorMessage = '💼 Spotřebovali jste svých **5 milionů tokenů** z Professional plánu!\n\n🏢 Pro náročnější projekty doporučujeme **Business plán** (2 290 Kč/měsíc):\n• **10 milionů tokenů** měsíčně (2x více!)\n• **Nejvyšší priorita generování**\n• **Telefonická podpora**\n• **Pro týmy a větší projekty**\n\n👉 [Upgrade na Business](/subscription)'
        } else if (userPlan === 'business') {
          errorMessage = '🏢 Spotřebovali jste svých **10 milionů tokenů** z Business plánu!\n\n⭐ Pro neomezené použití zkuste **Unlimited plán** (4 970 Kč/měsíc):\n• **Neomezené tokeny** - žádné limity!\n• **24/7 prioritní podpora**\n• **Dedicated account manager**\n• **SLA 99.9%**\n\n👉 [Upgrade na Unlimited](/subscription)'
        } else {
          errorMessage = `Dosáhli jste měsíčního limitu tokenů pro váš ${userPlan} plán. Tokeny se obnoví začátkem příštího měsíce nebo si můžete upgradovat plán.`
        }
      } else if (error.message?.includes('Subscription inactive') || error.message?.includes('expired')) {
        errorMessage = 'Vaše předplatné není aktivní nebo vypršelo. Zkontrolujte prosím stav platby ve správě předplatného.'
      }
      
      await addMessage(sessionId, { 
        role: 'assistant', 
        content: errorMessage
      })
    } finally {
      set({ isGenerating: false, processingStatus: null, streamingText: null })
    }
  },
  
  clearGeneratedFiles: () => {
    set({ lastGeneratedFiles: [] })
  },
  
  setProcessingStatus: (status: string | null) => {
    set({ processingStatus: status })
  },
  
  clearError: () => {
    set({ error: null })
  },

  sendChatMessage: async (sessionId: string, content: string, projectContext?: any, model: 'sonnet' | 'haiku' = 'sonnet') => {
    const { addMessage } = get()
    
    // Add user message
    await addMessage(sessionId, { role: 'user', content })
    
    // Track AI prompt submission
    trackAIPromptSubmitted(model)
    
    set({ isGenerating: true, processingStatus: 'Přemýšlím o vaší otázce...' })
    
    try {
      // Prepare context for Claude Chat
      const currentFiles = projectContext?.files?.map((file: any) => ({
        id: file.id,
        name: file.name,
        content: file.content,
        language: file.language,
        path: file.path
      })) || []
      
      // Get conversation context from last 5 messages (excluding the just-added user message)
      const currentSession = get().currentSession
      const conversationContext = currentSession?.messages ? 
        currentSession.messages
          .slice(-6, -1) // Get last 6 messages, excluding the newest one
          .slice(-5)     // Take only last 5 for context
          .map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            timestamp: msg.timestamp
          })) : []
      
      // Get current user ID
      const userId = useAuthStore.getState().user?.id
      
      if (!userId) {
        throw new Error('Musíte být přihlášeni pro použití AI')
      }
      
      console.log(`[ChatStore] Sending chat request using ${model} model...`)
      
      const response = await claudeService.sendChatMessage({
        prompt: content,
        projectContext: projectContext?.name ? `Project: ${projectContext.name} - ${projectContext.description}` : undefined,
        currentFiles,
        conversationContext,
        userId,
        model
      })
      
      console.log(`[ChatStore] Chat response received, adding to session`)
      
      // Add AI response
      await addMessage(sessionId, { 
        role: 'assistant', 
        content: response.content,
        isChat: true // Flag to distinguish chat responses
      })
      
      // Update token usage
      if (response.usage) {
        try {
          await subscriptionService.updateTokenUsage(userId, response.usage.input_tokens + response.usage.output_tokens)
        } catch (error) {
          console.warn('Failed to update token usage:', error)
        }
      }
      
      set({ 
        isGenerating: false, 
        processingStatus: null
      })
      
    } catch (error: any) {
      console.error('Chat error:', error)
      set({ 
        error: error.message,
        isGenerating: false,
        processingStatus: null
      })
      
      // Add error message to chat
      await addMessage(sessionId, { 
        role: 'assistant', 
        content: `Omlouvám se, došlo k chybě: ${error.message}`,
        isChat: true
      })
    }
  },

  subscribeToMessages: (sessionId: string) => {
    const { unsubscribe: currentUnsub } = get()
    
    // Unsubscribe from previous listener if exists
    if (currentUnsub) {
      currentUnsub()
    }
    
    // Subscribe to real-time message updates
    const unsubscribe = chatService.subscribeToMessages(sessionId, (messages) => {
      set(state => {
        if (!state.currentSession || state.currentSession.id !== sessionId) return state
        
        // Update current session with new messages
        const updatedSession = { ...state.currentSession, messages }
        
        return {
          currentSession: updatedSession,
          sessions: state.sessions.map(s => 
            s.id === sessionId ? updatedSession : s
          )
        }
      })
    })
    
    set({ unsubscribeMessages: unsubscribe })
  },

  unsubscribe: () => {
    const { unsubscribeMessages } = get()
    if (unsubscribeMessages) {
      unsubscribeMessages()
      set({ unsubscribeMessages: null })
    }
  }
}))