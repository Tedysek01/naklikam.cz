import { useEffect, useRef, useState } from 'react'
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

import { containerService } from '@/services/ContainerService'

interface TerminalPanelProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

export default function TerminalPanel({ isOpen, onClose, projectId }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [output, setOutput] = useState<string[]>([])
  const [isMaximized, setIsMaximized] = useState(false)
  const [command, setCommand] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Subscribe to WebContainer output
      subscribeToOutput()
    }
  }, [isOpen])

  const subscribeToOutput = () => {
    containerService.onOutput = (data: string) => {
      setOutput(prev => [...prev, data])
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  const handleRunCommand = async () => {
    if (!command.trim()) return

    setIsRunning(true)
    setOutput(prev => [...prev, `$ ${command}`])

    try {
      const [cmd, ...args] = command.split(' ')
      await containerService.runCommand(cmd, args, projectId)
    } catch (error) {
      setOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsRunning(false)
      setCommand('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleRunCommand()
    }
  }

  const clearTerminal = () => {
    setOutput([])
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed bg-background border-t transition-all duration-300 ${
        isMaximized 
          ? 'inset-0 z-50' 
          : 'bottom-0 left-0 right-0 h-80 z-40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-7 px-2 text-xs"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-7 w-7 p-0"
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm"
        style={{ height: isMaximized ? 'calc(100% - 88px)' : 'calc(100% - 88px)' }}
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            Terminal - Zadejte příkaz
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {line}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-gray-900 p-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-sm">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-gray-100 font-mono text-sm outline-none placeholder-gray-600"
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleRunCommand}
            disabled={isRunning || !command.trim()}
          >
            Run
          </Button>
        </div>
      </div>
    </div>
  )
}