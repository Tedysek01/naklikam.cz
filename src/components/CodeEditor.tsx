import { useRef, useEffect, useCallback, useState } from 'react'
import Editor from '@monaco-editor/react'
import { ProjectFile } from '@/types'
import { useProjectStore } from '@/store/projectStore'
import { containerService } from '@/services/ContainerService'
import { debounce } from 'lodash'
import { useAuthStore } from '@/store/authStore'
import { canViewCode, getUpgradeMessage } from '@/utils/subscriptionUtils'
import UpgradePrompt from '@/components/deployment/UpgradePrompt'

interface CodeEditorProps {
  file: ProjectFile | null
}

export default function CodeEditor({ file }: CodeEditorProps) {
  const { user } = useAuthStore()
  const { updateProjectFile } = useProjectStore()
  const editorRef = useRef<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user can view code
  if (!canViewCode(user)) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <UpgradePrompt 
          feature="code_view"
          message={getUpgradeMessage('code_view')}
        />
      </div>
    )
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  // Function to simulate typing effect with better performance
  const typeContent = useCallback(async (targetContent: string, currentContent: string = '') => {
    if (!editorRef.current || targetContent === currentContent) return;
    
    setIsTyping(true);
    const editor = editorRef.current;
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Calculate typing speed based on content length - faster for streaming
    const charsToAdd = targetContent.length - currentContent.length;
    const typingSpeed = Math.max(2, Math.min(15, Math.floor(charsToAdd / 200))); // 2-15ms per char
    
    let currentIndex = currentContent.length;
    
    const typeChar = () => {
      if (currentIndex < targetContent.length && editorRef.current) {
        // Type multiple characters at once for better performance with large content
        const charsPerTick = Math.min(5, targetContent.length - currentIndex);
        const nextContent = targetContent.substring(0, currentIndex + charsPerTick);
        editor.setValue(nextContent);
        currentIndex += charsPerTick;
        
        // Auto-scroll to bottom for streaming content
        const lineCount = editor.getModel()?.getLineCount() || 1;
        editor.revealLine(lineCount);
        
        typingTimeoutRef.current = setTimeout(typeChar, typingSpeed);
      } else {
        setIsTyping(false);
      }
    };
    
    typeChar();
  }, []);

  // Keep track of current editor content
  const currentContentRef = useRef<string>('')
  
  // Debounced function to update store and sync with WebContainer
  const debouncedUpdate = useCallback(
    debounce(async (fileId: string, path: string, content: string) => {
      try {
        console.log(`[CodeEditor] DEBOUNCED UPDATE:`, {
          fileId,
          path,
          contentLength: content.length,
          contentPreview: content.substring(0, 100) + '...'
        })
        updateProjectFile(fileId, content)
        await containerService.writeFile(path, content)
        console.log('Updated and synced:', path)
      } catch (error) {
        console.error('Failed to update/sync:', error)
      }
    }, 2000), // Longer debounce to avoid frequent updates
    [updateProjectFile]
  )

  const handleEditorChange = (value: string | undefined) => {
    if (file && value !== undefined) {
      console.log(`[CodeEditor] EDITOR CHANGE:`, {
        fileId: file.id,
        fileName: file.name,
        filePath: file.path,
        valueLength: value.length,
        valuePreview: value.substring(0, 50) + '...'
      })
      // Store current content in ref for immediate access
      currentContentRef.current = value
      // Debounce store updates to avoid frequent re-renders
      debouncedUpdate(file.id, file.path, value)
    }
  }

  // Update editor content when switching files
  useEffect(() => {
    if (editorRef.current && file) {
      const currentValue = editorRef.current.getValue()
      // Update editor with file content when switching files
      if (currentValue !== file.content) {
        editorRef.current.setValue(file.content)
        currentContentRef.current = file.content
      }
    }
  }, [file?.id]) // Only watch file ID changes, not content
  
  // Watch for content changes and trigger typing effect
  useEffect(() => {
    if (editorRef.current && file && !isTyping) {
      const currentValue = editorRef.current.getValue()
      // If file content changed externally (from AI update), show typing effect  
      const fileContent = typeof file.content === 'string' ? file.content : JSON.stringify(file.content, null, 2);
      if (currentValue !== fileContent && fileContent !== currentContentRef.current) {
        console.log('[CodeEditor] File content changed, starting typing effect:', {
          fileId: file.id,
          currentLength: currentValue.length,
          newLength: fileContent.length
        });
        typeContent(fileContent, currentValue);
        currentContentRef.current = fileContent;
      }
    }
  }, [file?.content, isTyping, typeContent]); // Watch content changes
  
  // Track previous file to save its content when switching
  const previousFileRef = useRef<ProjectFile | null>(null)

  // COMPLETELY DISABLE auto-save on file switch to prevent data corruption
  useEffect(() => {
    console.log(`[CodeEditor] File effect triggered:`, {
      newFile: file ? { id: file.id, name: file.name, path: file.path, isDirectory: file.isDirectory } : null,
      previousFile: previousFileRef.current ? { id: previousFileRef.current.id, name: previousFileRef.current.name, path: previousFileRef.current.path, isDirectory: previousFileRef.current.isDirectory } : null,
      hasEditor: !!editorRef.current
    })
    
    // DISABLE problematic auto-save logic completely
    // The debounced save on typing (handleEditorChange) is sufficient
    if (previousFileRef.current && file && previousFileRef.current.id !== file.id) {
      console.log(`[CodeEditor] File switch detected - AUTO-SAVE DISABLED for safety:`, {
        previousFile: { id: previousFileRef.current.id, name: previousFileRef.current.name, path: previousFileRef.current.path, isDirectory: previousFileRef.current.isDirectory },
        newFile: { id: file.id, name: file.name, path: file.path, isDirectory: file.isDirectory }
      })
      console.log(`[CodeEditor] Auto-save on switch DISABLED to prevent data corruption!`)
    }
    
    // Update the previous file reference (but don't save anything)
    previousFileRef.current = file
  }, [file?.id])

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [])

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold font-display mb-2">No file selected</h3>
          <p className="text-muted-foreground">
            Select a file from the file tree to start editing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="border-b p-3 md:p-4 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display text-sm md:text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{file.path}</p>
          </div>
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Aktualizuji...
            </div>
          )}
        </div>
      </div>
      <div className="h-[calc(100%-64px)]">
        <Editor
          height="100%"
          defaultLanguage={file.language}
          language={file.language}
          value={file.content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: window.innerWidth < 768 ? 13 : 14, // Smaller font on mobile
            lineNumbers: window.innerWidth < 768 ? 'off' : 'on', // Hide line numbers on mobile
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            folding: window.innerWidth < 768 ? false : true, // Disable folding on mobile
            foldingStrategy: 'indentation',
            showFoldingControls: window.innerWidth < 768 ? 'never' : 'always',
            unfoldOnClickAfterEndOfLine: false,
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: window.innerWidth < 768 ? false : true
            },
            // Mobile-friendly options
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: window.innerWidth < 768 ? 8 : 14,
              horizontalScrollbarSize: window.innerWidth < 768 ? 8 : 14
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true
          }}
        />
      </div>
    </div>
  )
}