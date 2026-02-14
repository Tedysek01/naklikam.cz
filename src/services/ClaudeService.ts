// Note: Claude Code SDK is designed for Node.js environments
// For browser usage, we'll use the Anthropic API directly

import { IntentDetector, IntentAnalysis } from '@/utils/intentDetector'
import { FileMatchingEngine, FileMatchAnalysis } from '@/utils/fileMatching'
import { StructuredResponse } from '@/types'
import PathUtils from '@/utils/pathUtils'

export interface CodeGenerationRequest {
  prompt: string
  projectContext?: string
  currentFiles?: Array<{
    id: string
    name: string
    content: string
    language: string
    path: string
  }>
  uploadedImages?: Array<{
    fileName: string
    url: string
  }>
  conversationContext?: Array<{
    role: string
    content: string
    timestamp: string
  }>
  userId?: string
  model?: 'sonnet' | 'haiku'
}

export interface CodeGenerationResponse {
  content: string
  thinking?: string
  hasThinking?: boolean
  structured?: StructuredResponse
  isStructured?: boolean
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  suggestedFiles?: Array<{
    name: string
    content: string
    language: string
    path: string
    operation: 'create' | 'update' // New field to indicate operation type
    existingFileId?: string // ID of existing file if updating
    matchConfidence?: number // Confidence in file matching
    matchReasons?: string[] // Reasons for the match
  }>
  intentAnalysis?: IntentAnalysis // Overall intent analysis
}

export interface StreamingProgressUpdate {
  type: 'progress' | 'streaming' | 'complete' | 'error' | 'warning'
  message?: string
  progress?: number
  text?: string // New character(s) from streaming
  partialContent?: string
  content?: string
  thinking?: string
  hasThinking?: boolean
  error?: string
}

export class ClaudeService {
  // Streaming method for long-running tasks
  async generateCodeWithStreaming(
    request: CodeGenerationRequest, 
    onProgress: (update: StreamingProgressUpdate) => void
  ): Promise<CodeGenerationResponse> {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/claude/stream'
      : 'http://localhost:3002/api/claude/stream'
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }
      
      const decoder = new TextDecoder()
      let finalResult: CodeGenerationResponse | undefined = undefined
      let buffer = '' // Buffer for partial JSON chunks
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk // Add to buffer
          
          // Process complete lines from buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (!data || data === '[DONE]') continue
              
              try {
                const update: StreamingProgressUpdate = JSON.parse(data)
                
                // Call progress callback
                onProgress(update)
                
                // If complete, process the final result
                if (update.type === 'complete' && update.content) {
                  // Check for subscription/auth errors in streaming content - don't throw, just return as error response
                  if (update.content.includes('Nepodařilo se ověřit předplatné') ||
                      update.content.includes('Předplatné je vyžadováno') ||
                      update.content.includes('Předplatné není aktivní') ||
                      update.content.includes('Pro použití AI je potřeba placené předplatné') ||
                      update.content.includes('Vyčerpáno tokenů')) {
                    
                    finalResult = {
                      content: update.content,
                      thinking: update.thinking,
                      hasThinking: update.hasThinking || false,
                      structured: undefined,
                      isStructured: false,
                      suggestedFiles: [],
                      intentAnalysis: undefined
                    }
                    break
                  }
                  // Process the final content to extract files (same as regular method)
                  let suggestedFiles: Array<{
                    name: string
                    content: string
                    language: string
                    path: string
                    operation: 'create' | 'update'
                    existingFileId?: string
                    matchConfidence?: number
                    matchReasons?: string[]
                  }> = []
                  
                  // Try to parse as structured response first
                  let structuredResponse = null
                  let isStructured = false
                  
                  try {
                    let cleanContent = update.content.trim()
                    
                    // Remove code blocks
                    if (cleanContent.startsWith('```json')) {
                      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
                    }
                    if (cleanContent.startsWith('```')) {
                      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
                    }
                    
                    // Ensure we have valid JSON content
                    if (!cleanContent.startsWith('{') || !cleanContent.endsWith('}')) {
                      console.log('[STREAMING] Content does not look like complete JSON, skipping structured parsing');
                      throw new Error('Not complete JSON content');
                    }
                    
                    structuredResponse = JSON.parse(cleanContent)
                    isStructured = true
                  } catch (error) {
                    console.log('[STREAMING] Failed to parse as structured response:', error instanceof Error ? error.message : 'Unknown error');
                    // Not structured, will parse code blocks
                  }
                  
                  if (isStructured && structuredResponse?.files) {
                    // Use statically imported utils
                    console.log('[STREAMING] Processing structured files:', structuredResponse.files.length);
                    
                    // Convert structured files to suggested files format with file matching
                    suggestedFiles = structuredResponse.files.map((file: any, index: number) => {
                      console.log(`[STREAMING] Processing file ${index + 1}/${structuredResponse.files.length}:`, {
                        path: file.path,
                        contentLength: file.content?.length || 0,
                        contentPreview: typeof file.content === 'string' ? file.content.substring(0, 100) + '...' : '[Invalid content type]'
                      });
                      // Validate file data before processing
                      if (!file.path || !file.content) {
                        console.error('[STREAMING] Invalid file data - missing path or content:', { 
                          path: file.path, 
                          hasContent: !!file.content
                        });
                        return null; // Skip invalid files
                      }
                      
                      // Convert content to string if it's an object (for JSON files)
                      let fileContent = file.content;
                      if (typeof fileContent === 'object') {
                        console.log(`[STREAMING] Converting object content to string for ${file.path}`);
                        try {
                          fileContent = JSON.stringify(fileContent, null, 2);
                        } catch (e) {
                          console.error(`[STREAMING] Failed to stringify content for ${file.path}:`, e);
                          return null;
                        }
                      } else if (typeof fileContent !== 'string') {
                        console.error('[STREAMING] Invalid content type:', {
                          path: file.path,
                          contentType: typeof fileContent
                        });
                        return null;
                      }
                      
                      // Check if content matches expected file type
                      const isPackageJson = file.path.includes('package.json');
                      const looksLikeJson = fileContent.trim().startsWith('{');
                      
                      if (isPackageJson && !looksLikeJson) {
                        console.error('[STREAMING] Package.json has invalid content (not JSON):', {
                          path: file.path,
                          contentStart: fileContent.substring(0, 50)
                        });
                        return null; // Skip invalid package.json
                      }
                      
                      let finalOperation: 'create' | 'update' = file.operation as 'create' | 'update'
                      let existingFileId: string | undefined
                      let matchConfidence: number | undefined
                      let matchReasons: string[] | undefined
                      
                      // Try to find matching existing file
                      if (request.currentFiles && request.currentFiles.length > 0) {
                        const matchResult = FileMatchingEngine.findBestMatch(
                          file.path,
                          file.language === 'tsx' ? 'typescript' : file.language,
                          request.currentFiles
                        )
                        
                        if (matchResult.bestMatch && matchResult.confidence > 0.5) {
                          finalOperation = 'update'
                          existingFileId = matchResult.bestMatch.existingFile.id
                          matchConfidence = matchResult.confidence
                          matchReasons = matchResult.bestMatch.reasons
                        }
                      }
                      
                      const normalizedPath = PathUtils.normalize(file.path)
                      
                      return {
                        name: PathUtils.getFileName(file.path),
                        content: fileContent,
                        language: file.language === 'tsx' ? 'typescript' : file.language,
                        path: normalizedPath,
                        operation: finalOperation,
                        existingFileId,
                        matchConfidence,
                        matchReasons
                      }
                    }).filter(Boolean) // Remove null values from invalid files
                  } else {
                    // Fallback to code block parsing
                    suggestedFiles = this.parseCodeBlocksWithMatching(
                      update.content, 
                      request.currentFiles || [],
                      undefined
                    )
                  }
                  
                  console.log('[STREAMING] Final suggested files:', suggestedFiles.map(f => ({
                    path: f.path,
                    operation: f.operation,
                    contentLength: f.content.length
                  })));
                  
                  finalResult = {
                    content: update.content,
                    thinking: update.thinking,
                    hasThinking: update.hasThinking || false,
                    structured: structuredResponse,
                    isStructured: isStructured,
                    suggestedFiles,
                    intentAnalysis: undefined
                  }
                }
                
                if (update.type === 'error') {
                  // Check if it's a subscription error - if so, don't throw, return as error response
                  if (update.error && (
                    update.error.includes('Nepodařilo se ověřit předplatné') ||
                    update.error.includes('Předplatné je vyžadováno') ||
                    update.error.includes('Předplatné není aktivní') ||
                    update.error.includes('Pro použití AI je potřeba placené předplatné') ||
                    update.error.includes('Vyčerpáno tokenů'))) {
                    
                    finalResult = {
                      content: update.error,
                      thinking: '',
                      hasThinking: false,
                      structured: undefined,
                      isStructured: false,
                      suggestedFiles: [],
                      intentAnalysis: undefined
                    }
                    break // Exit streaming loop with error response
                  }
                  
                  // For other errors, still throw
                  throw new Error(update.error || 'Streaming error')
                }
              } catch (parseError) {
                // Only log if it's not a partial JSON chunk
                if (!data.includes('"type"') || data.length < 20) {
                  console.warn('Failed to parse SSE data (partial chunk):', data.substring(0, 100) + '...')
                } else {
                  console.warn('Failed to parse complete SSE data:', parseError, 'Data length:', data.length)
                }
                // Skip malformed chunks - they'll be fixed in next chunk
                continue
              }
            }
          }
        }
      
        // Process any remaining data in buffer
        if (buffer.trim()) {
          console.log('Processing remaining buffer data:', buffer.substring(0, 100) + '...')
          if (buffer.startsWith('data: ')) {
            const data = buffer.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const update: StreamingProgressUpdate = JSON.parse(data)
                onProgress(update)
                if (update.type === 'complete' && update.content && !finalResult) {
                  console.log('Final result found in buffer')
                  // Process this final result too
                }
              } catch (parseError) {
                console.warn('Failed to parse buffer data:', parseError)
              }
            }
          }
        }
      
        if (!finalResult) {
          throw new Error('No final result received from streaming')
        }
        
        return finalResult
        
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      console.error('Streaming generation error:', error)
      // Don't fallback here - let the calling code handle it
      throw error
    }
  }
  private async generateWithClaude(request: CodeGenerationRequest): Promise<{content: string, thinking?: string, hasThinking?: boolean, structured?: StructuredResponse, isStructured?: boolean, usage?: {input_tokens: number, output_tokens: number}}> {
    try {
      // Use backend proxy to avoid CORS issues
      // In production (Vercel), use relative path; in development, use localhost
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? '/api/claude'
        : 'http://localhost:3002/api/claude'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          projectContext: request.projectContext,
          currentFiles: request.currentFiles,
          uploadedImages: request.uploadedImages,
          conversationContext: request.conversationContext,
          userId: request.userId,
          model: request.model || 'sonnet'
        })
      })

      if (!response.ok) {
        throw new Error(`Proxy API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      // Check for explicit error field - but DON'T throw subscription errors, return them as content
      if (data.error) {
        // If it's a subscription error, return it as regular content so ChatStore can handle it properly
        if (data.error.includes('Předplatné') || 
            data.error.includes('subscription') || 
            data.error.includes('authentication required') ||
            data.error.includes('Nepodařilo se ověřit předplatné')) {
          return {
            content: data.error,
            thinking: '',
            hasThinking: false,
            isStructured: false,
            usage: undefined
          }
        }
        // For other errors, still throw
        throw new Error(data.error || data.message || 'API Error')
      }
      
      // Check if content contains subscription/auth errors - don't throw, let ChatStore handle them
      const content = data.content || ''
      
      // Don't throw for subscription errors - let them pass through to ChatStore for proper handling
      
      return {
        content: content || 'I apologize, but I was unable to generate a response. Please try again.',
        thinking: data.thinking,
        hasThinking: data.hasThinking,
        structured: data.structured,
        isStructured: data.isStructured || false,
        usage: data.usage
      }
      
    } catch (error) {
      console.error('Claude API error:', error)
      
      // Fallback to enhanced mock responses when API is not available
      return {
        content: this.generateMockResponse(request),
        thinking: undefined,
        hasThinking: false,
        structured: undefined,
        isStructured: false,
        usage: undefined
      }
    }
  }

  private generateMockResponse(request: CodeGenerationRequest): string {
    const prompt = request.prompt.toLowerCase()
    
    if (prompt.includes('component') || prompt.includes('react')) {
      return `I'll help you create a React component! Here's a well-structured component:

\`\`\`tsx
import React, { useState } from 'react'

interface Props {
  title?: string
  className?: string
}

export default function MyComponent({ title = 'Default Title', className }: Props) {
  const [count, setCount] = useState(0)

  return (
    <div className={\`p-4 border rounded-lg \${className}\`}>
      <h2 className="text-xl font-bold font-display mb-4">{title}</h2>
      <div className="space-y-2">
        <p>Count: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>
    </div>
  )
}
\`\`\`

This component includes:
- TypeScript props with defaults
- State management with useState
- Tailwind CSS styling
- Accessible button interaction
- Clean, reusable structure`
    }
    
    if (prompt.includes('function') || prompt.includes('utility')) {
      return `Here's a useful utility function for you:

\`\`\`typescript
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
\`\`\`

These utilities provide:
- Date formatting with localization
- Debounce function for performance
- Class name utility for conditional styling`
    }
    
    if (prompt.includes('api') || prompt.includes('service')) {
      return `I'll create an API service for you:

\`\`\`typescript
export class ApiService {
  private baseUrl: string
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`)
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
    return response.json()
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`)
    return response.json()
  }
}

// Usage example:
const api = new ApiService()
const users = await api.get<User[]>('/users')
\`\`\`

This service provides:
- Type-safe HTTP methods
- Error handling
- JSON serialization
- Configurable base URL`
    }
    
    // Default enhanced response
    return `I'd be happy to help you with that! Based on your request "${request.prompt}", here are some suggestions:

## Approach
1. **Break down the problem** into smaller, manageable pieces
2. **Consider the user experience** and how this fits into your application
3. **Plan the implementation** with proper error handling and edge cases

## Implementation Tips
- Use TypeScript for better type safety
- Follow React best practices with proper state management
- Implement proper error boundaries and loading states
- Consider accessibility from the start
- Write clean, documented code

## Next Steps
1. Start with a basic implementation
2. Test thoroughly with different scenarios  
3. Refactor and optimize as needed
4. Add proper error handling and user feedback

Would you like me to help you implement any specific part of this? I can provide more detailed code examples for your specific use case.`
  }

  // Regular non-streaming method (keep for fallback)
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    // 1. Analyze user intent
    const existingFileNames = request.currentFiles?.map(f => f.name) || []
    const userIntentAnalysis = IntentDetector.analyzeUserPrompt(request.prompt, existingFileNames)
    
    console.log('User Intent Analysis:', userIntentAnalysis)
    
    const result = await this.generateWithClaude(request)
    
    console.log('Response content length:', result.content.length)
    console.log('Content preview:', result.content.substring(0, 200) + '...')
    console.log('Is structured response:', result.isStructured)
    
    let suggestedFiles: Array<{
      name: string
      content: string
      language: string
      path: string
      operation: 'create' | 'update'
      existingFileId?: string
      matchConfidence?: number
      matchReasons?: string[]
    }> = []
    
    // Handle structured response
    if (result.isStructured && result.structured?.files) {
      console.log('[ClaudeService] Processing structured response with', result.structured.files.length, 'files:')
      console.log('[ClaudeService] Structured files:', result.structured.files.map(f => ({ path: f.path, operation: f.operation })))
      
      // Convert structured files to suggested files format with file matching
      let convertedFiles = result.structured.files.map((file, index) => {
        console.log(`[ClaudeService] Processing structured file ${index + 1}: ${file.path}`)
        
        // Validate and convert content to string if needed
        if (!file.path || !file.content) {
          console.error('[ClaudeService] Invalid file data - missing path or content:', { 
            path: file.path, 
            hasContent: !!file.content
          });
          return null;
        }
        
        // Convert content to string if it's an object (for JSON files)
        let fileContent = file.content;
        if (typeof fileContent === 'object') {
          console.log(`[ClaudeService] Converting object content to string for ${file.path}`);
          try {
            fileContent = JSON.stringify(fileContent, null, 2);
          } catch (e) {
            console.error(`[ClaudeService] Failed to stringify content for ${file.path}:`, e);
            return null;
          }
        } else if (typeof fileContent !== 'string') {
          console.error('[ClaudeService] Invalid content type:', {
            path: file.path,
            contentType: typeof fileContent
          });
          return null;
        }
        
        let finalOperation: 'create' | 'update' = file.operation as 'create' | 'update'
        let existingFileId: string | undefined
        let matchConfidence: number | undefined
        let matchReasons: string[] | undefined
        
        // Always try to find matching existing file, regardless of operation
        if (request.currentFiles && request.currentFiles.length > 0) {
          const matchResult = FileMatchingEngine.findBestMatch(
            file.path,
            file.language === 'tsx' ? 'typescript' : file.language,
            request.currentFiles
          )
          
          console.log(`File matching for ${file.path}:`, {
            confidence: matchResult.confidence,
            shouldUpdate: matchResult.shouldUpdate,
            bestMatch: matchResult.bestMatch?.existingFile.name
          })
          
          // If we have a good match (even for "create" operations), update instead
          if (matchResult.bestMatch && matchResult.confidence > 0.5) {
            finalOperation = 'update'
            existingFileId = matchResult.bestMatch.existingFile.id
            matchConfidence = matchResult.confidence
            matchReasons = matchResult.bestMatch.reasons
            console.log(`AUTO-UPDATE: ${file.path} -> ${matchResult.bestMatch.existingFile.name} (confidence: ${matchResult.confidence})`)
          }
        }
        
        // Normalize path to ensure consistency
        const normalizedPath = PathUtils.normalize(file.path)
        
        const result = {
          name: PathUtils.getFileName(file.path), // Extract filename from path
          content: fileContent,
          language: file.language === 'tsx' ? 'typescript' : file.language,
          path: normalizedPath,
          operation: finalOperation,
          existingFileId,
          matchConfidence,
          matchReasons
        }
        
        console.log(`[ClaudeService] Converted file: ${result.path} (${result.operation}) confidence: ${matchConfidence}`)
        return result
      }).filter(Boolean) as Array<{
        name: string
        content: string
        language: string
        path: string
        operation: 'create' | 'update'
        existingFileId?: string
        matchConfidence?: number
        matchReasons?: string[]
      }> // Remove null values from invalid files and assert correct type
      
      // REMOVED: No longer auto-generating config files - Claude should generate them
      suggestedFiles = convertedFiles
      console.log('[ClaudeService] Final suggested files:', suggestedFiles.map(f => ({ path: f.path, operation: f.operation, name: f.name })))
    }

    // Analyze AI response intent (for both structured and non-structured responses)
    const aiIntentAnalysis = IntentDetector.analyzeAIResponse(result.content)
    console.log('AI Intent Analysis:', aiIntentAnalysis)
    
    // Combine intent analyses
    const combinedIntentAnalysis = IntentDetector.combineAnalysis(userIntentAnalysis, aiIntentAnalysis)
    console.log('Combined Intent Analysis:', combinedIntentAnalysis)
    
    if (!result.isStructured) {
      // Fallback to legacy parsing for non-structured responses
      console.log('[ClaudeService] Using legacy code block parsing')
      
      // Parse response for suggested files with enhanced logic
      suggestedFiles = this.parseCodeBlocksWithMatching(
        result.content, 
        request.currentFiles || [],
        combinedIntentAnalysis
      )
    }
    
    // Check if response seems truncated
    const lastChars = result.content.slice(-100)
    const mightBeTruncated = result.content.length > 15000 && !lastChars.includes('```')
    
    if (mightBeTruncated) {
      console.warn('WARNING: Response may be truncated! Checking for incomplete files...')
      
      // Find any unclosed code blocks
      const incompleteFiles = this.findIncompleteFiles(result.content)
      
      if (incompleteFiles.length > 0) {
        console.log(`Found ${incompleteFiles.length} incomplete files. Requesting completion...`)
        
        // Request completion for each incomplete file
        for (const file of incompleteFiles) {
          try {
            const completionRequest: CodeGenerationRequest = {
              prompt: `Continue generating the ${file.language} file named "${file.name}". Start exactly where you left off. Here's the incomplete content so far:\n\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n\nPlease continue from where it was cut off and complete the entire file.`,
              projectContext: request.projectContext,
              currentFiles: request.currentFiles
            }
            
            const completionResult = await this.generateWithClaude(completionRequest)
            const completedFiles = this.parseCodeBlocksWithMatching(
              completionResult.content,
              request.currentFiles || [],
              combinedIntentAnalysis
            )
            
            if (completedFiles.length > 0) {
              // Replace or add the completed file
              const existingIndex = suggestedFiles.findIndex(f => f.name === file.name)
              if (existingIndex >= 0) {
                suggestedFiles[existingIndex] = completedFiles[0]
              } else {
                suggestedFiles.push(completedFiles[0])
              }
            }
          } catch (error) {
            console.error(`Failed to get completion for ${file.name}:`, error)
          }
        }
      }
    }
    
    return {
      content: result.content,
      thinking: result.thinking,
      hasThinking: result.hasThinking,
      structured: result.structured,
      isStructured: result.isStructured,
      usage: result.usage,
      suggestedFiles,
      intentAnalysis: result.isStructured ? undefined : (combinedIntentAnalysis || userIntentAnalysis)
    }
  }

  private parseCodeBlocksWithMatching(
    content: string, 
    existingFiles: Array<{
      id: string
      name: string
      content: string
      language: string
      path?: string
    }>,
    _intentAnalysis?: IntentAnalysis
  ): Array<{
    name: string
    content: string
    language: string
    path: string
    operation: 'create' | 'update'
    existingFileId?: string
    matchConfidence?: number
    matchReasons?: string[]
  }> {
    const files: Array<{
      name: string
      content: string
      language: string
      path: string
      operation: 'create' | 'update'
      existingFileId?: string
      matchConfidence?: number
      matchReasons?: string[]
    }> = []
    
    // Enhanced regex to handle UPDATE/CREATE markers
    const codeBlockRegex = /```(\w+)?\s*(?:\n\/\*\s*(UPDATE|CREATE):\s*([^*]+)\s*\*\/|\n<!--\s*(UPDATE|CREATE):\s*([^-]+?)\s*-->|\n\/\/\s*(UPDATE|CREATE):\s*([^\n]+))?\n([\s\S]*?)```/g
    let match
    let fileIndex = 0
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'plaintext'
      const operation1 = match[2] // /* */ comment style
      const fileName1 = match[3]
      const operation2 = match[4] // <!-- --> comment style  
      const fileName2 = match[5]
      const operation3 = match[6] // // comment style
      const fileName3 = match[7]
      const blockContent = match[8]
      
      const operation = (operation1 || operation2 || operation3 || '').toUpperCase()
      const explicitFileName = (fileName1 || fileName2 || fileName3 || '').trim()
      
      let finalFileName = explicitFileName
      let suggestedOperation: 'create' | 'update' = 'create'
      let matchResult: FileMatchAnalysis | undefined
      
      // If AI explicitly marked the operation, use it
      if (operation === 'UPDATE') {
        suggestedOperation = 'update'
      } else if (operation === 'CREATE') {
        suggestedOperation = 'create'
      }
      
      // If no explicit filename, try to extract from content or generate
      if (!finalFileName) {
        const firstLineMatch = blockContent.match(/^(?:(?:\/\*\s*(?:filename|UPDATE|CREATE):\s*([^*]+)\s*\*\/)|(?:<!--\s*(?:filename|UPDATE|CREATE):\s*([^-]+?)\s*-->)|(?:\/\/\s*(?:filename|UPDATE|CREATE):\s*([^\n]+))|(?:FILE:|filename:|File:|FILENAME:)\s*([^\n]+))\n([\s\S]*)/)
        
        if (firstLineMatch) {
          finalFileName = (firstLineMatch[1] || firstLineMatch[2] || firstLineMatch[3] || firstLineMatch[4]).trim()
        } else if (this.looksLikeCompleteFile(blockContent)) {
          fileIndex++
          finalFileName = this.generateFileName(language, blockContent, fileIndex)
        }
      }
      
      if (finalFileName && this.looksLikeCompleteFile(blockContent)) {
        // Use file matching to find potential existing file
        matchResult = FileMatchingEngine.findBestMatch(
          finalFileName,
          language === 'tsx' ? 'typescript' : language,
          existingFiles.map(f => ({
            id: f.id,
            name: f.name,
            path: f.path || `/${f.name}`,
            language: f.language
          }))
        )
        
        // Decision logic for update vs create
        let finalOperation: 'create' | 'update' = suggestedOperation
        let existingFileId: string | undefined
        
        // Always prefer updating if we have a match
        if (matchResult.bestMatch && matchResult.confidence > 0.5) {
          finalOperation = 'update'
          existingFileId = matchResult.bestMatch.existingFile.id
          console.log(`AUTO-UPDATE (legacy): ${finalFileName} -> ${matchResult.bestMatch.existingFile.name} (confidence: ${matchResult.confidence})`)
        }
        
        console.log(`File processing: ${finalFileName}`, {
          aiOperation: operation,
          matchConfidence: matchResult.confidence,
          finalOperation,
          existingFileId
        })
        
        // Normalize path for consistency
        const normalizedPath = PathUtils.normalize(finalFileName)
        
        files.push({
          name: PathUtils.getFileName(finalFileName), // Extract filename from path
          content: blockContent.trim(),
          language: language === 'tsx' ? 'typescript' : language,
          path: normalizedPath,
          operation: finalOperation,
          existingFileId,
          matchConfidence: matchResult.confidence,
          matchReasons: matchResult.bestMatch?.reasons
        })
      }
    }
    
    console.log('[ClaudeService] Total files processed:', files.length)
    
    // REMOVED: No longer auto-generating config files
    console.log('[ClaudeService] Final legacy parsed files:', files.map(f => ({ path: f.path, operation: f.operation })))
    return files
  }

  // REMOVED: No longer auto-generating config files - Claude should generate them as part of the response

  
  private looksLikeCompleteFile(content: string): boolean {
    if (content.length < 50) return false
    
    // Check for common file indicators
    return (
      content.includes('<!DOCTYPE') ||
      content.includes('<html') ||
      content.includes('export') ||
      content.includes('import') ||
      content.includes('function') ||
      content.includes('class') ||
      content.includes('const') ||
      content.includes(':root') ||
      content.includes('body {') ||
      content.includes('* {')
    )
  }
  
  private generateFileName(language: string, content: string, index: number): string {
    // Try to extract component/function name
    const nameMatch = content.match(/(?:export\s+default\s+)?(?:function|class|const)\s+(\w+)/i)
    
    if (nameMatch && (language.includes('tsx') || language === 'typescript')) {
      const componentName = nameMatch[1]
      
      // Determine if it's a component, hook, or utility
      if (content.includes('return (') && content.includes('JSX')) {
        return `components/${componentName}.tsx`
      } else if (componentName.startsWith('use')) {
        return `hooks/${componentName}.ts`
      } else if (content.includes('interface') || content.includes('type')) {
        return `types/${componentName}.ts`
      } else {
        return `utils/${componentName}.ts`
      }
    }
    
    // Check for common React patterns
    if (language === 'typescript' || language === 'tsx') {
      // Component pattern
      if (content.includes('export default function') && content.includes('return (')) {
        return `components/Component${index}.tsx`
      }
      // Hook pattern
      if (content.includes('use') && (content.includes('useState') || content.includes('useEffect'))) {
        return `hooks/useCustomHook${index}.ts`
      }
      // Type definitions
      if (content.includes('interface') || content.includes('type')) {
        return `types/index.ts`
      }
      // Utilities
      return `utils/helper${index}.ts`
    }
    
    // Fallback for other languages (should be rare with modern stack)
    switch (language) {
      case 'json':
        return index === 1 ? 'package.json' : `config-${index}.json`
      case 'javascript':
        // Modern JS config files
        if (content.includes('tailwind')) return 'tailwind.config.js'
        if (content.includes('postcss')) return 'postcss.config.js'
        if (content.includes('vite')) return 'vite.config.js'
        return `config-${index}.js`
      default:
        return `${language}-file-${index}.${this.getExtensionForLanguage(language)}`
    }
  }

  
  private findIncompleteFiles(content: string): Array<{
    name: string
    content: string
    language: string
  }> {
    const incompleteFiles: Array<{
      name: string
      content: string
      language: string
    }> = []
    
    // Look for code blocks that start but don't end
    const openBlockRegex = /```(\w+)?\s*(?:\n\/\*\s*filename:\s*([^*]+)\s*\*\/|\n<!--\s*filename:\s*([^-]+?)\s*-->|\n\/\/\s*filename:\s*([^\n]+))?\n([\s\S]*?)$/g
    
    let match
    while ((match = openBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'plaintext'
      const fileName = (match[2] || match[3] || match[4] || '').trim()
      const partialContent = match[5]
      
      // Check if this code block is not closed
      if (!partialContent.includes('```')) {
        incompleteFiles.push({
          name: fileName || `incomplete.${this.getExtensionForLanguage(language)}`,
          content: partialContent,
          language
        })
      }
    }
    
    return incompleteFiles
  }
  
  // Chat method for conversational responses (not code generation)
  async sendChatMessage(request: CodeGenerationRequest): Promise<{
    content: string
    usage?: {
      input_tokens: number
      output_tokens: number
    }
  }> {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/claude'
      : 'http://localhost:3002/api/claude'
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          chatMode: true // Flag to indicate this is a chat request, not code generation
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check for subscription errors - don't throw, return them as content
      if (data.error && (
        data.error.includes('Nepodařilo se ověřit předplatné') ||
        data.error.includes('Předplatné je vyžadováno') ||
        data.error.includes('Předplatné není aktivní') ||
        data.error.includes('Pro použití AI je potřeba placené předplatné') ||
        data.error.includes('Vyčerpáno tokenů'))) {
        
        return {
          content: data.error,
          usage: undefined
        }
      }
      
      // If other errors, throw them
      if (data.error) {
        throw new Error(data.error)
      }
      
      return {
        content: data.content,
        usage: data.usage
      }
    } catch (error) {
      console.error('Claude chat service error:', error)
      throw error
    }
  }
  
  private getExtensionForLanguage(language: string): string {
    switch (language) {
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'javascript':
      case 'js':
        return 'js'
      case 'typescript':
      case 'tsx':
        return 'tsx'
      case 'json':
        return 'json'
      default:
        return 'txt'
    }
  }
}

export const claudeService = new ClaudeService()