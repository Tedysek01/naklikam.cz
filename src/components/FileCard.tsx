import { StructuredFile } from '@/types'

// Inline UI Components
const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-card border-border p-6 shadow-sm ${className}`} {...props}>
    {children}
  </div>
)
import { 
  RefreshCw, 
  FilePlus, 
  Info,
  Code
} from 'lucide-react'

interface FileCardProps {
  file: StructuredFile
  onAction?: (file: any, action: "download" | "add" | "copy") => void
}

export default function FileCard({ file, onAction: _onAction }: FileCardProps) {

  const getOperationIcon = () => {
    switch (file.operation) {
      case 'create':
        return <FilePlus className="h-4 w-4 text-green-400" />
      case 'update':
        return <RefreshCw className="h-4 w-4 text-purple-400" />
      case 'delete':
        return <div className="h-4 w-4 text-red-400">🗑️</div>
      default:
        return <Code className="h-4 w-4" />
    }
  }

  const getOperationColor = () => {
    switch (file.operation) {
      case 'create':
        return 'border-l-green-400 bg-green-900/20'
      case 'update':
        return 'border-l-purple-400 bg-purple-900/20'
      case 'delete':
        return 'border-l-red-400 bg-red-900/20'
      default:
        return 'border-l-gray-400 bg-gray-800/20'
    }
  }

  const getOperationBadge = () => {
    switch (file.operation) {
      case 'create':
        return 'text-green-400 bg-green-900/50'
      case 'update':
        return 'text-purple-400 bg-purple-900/50'
      case 'delete':
        return 'text-red-400 bg-red-900/50'
      default:
        return 'text-gray-400 bg-gray-800'
    }
  }

  const getLanguageIcon = () => {
    switch (file.language) {
      case 'typescript':
      case 'tsx':
        return '🔷'
      case 'javascript':
      case 'jsx':
        return '🟨'
      case 'html':
        return '🟧'
      case 'css':
        return '🎨'
      case 'json':
        return '📦'
      case 'markdown':
        return '📝'
      default:
        return '📄'
    }
  }


  return (
    <Card className={`border-l-4 ${getOperationColor()}`}>
      <div className="p-4">
        {/* File Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getOperationIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{file.path}</span>
                <span className="text-lg">{getLanguageIcon()}</span>
                <span className="text-xs text-muted-foreground">({file.language})</span>
              </div>
              {file.description && (
                <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationBadge()}`}>
              {file.operation.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Match Info for Updates */}
        {file.operation === 'update' && file.matchConfidence !== undefined && (
          <div className="mb-3 p-2 bg-purple-900/20 rounded text-xs border border-purple-700">
            <div className="flex items-center gap-1 mb-1">
              <Info className="h-3 w-3 text-purple-400" />
              <span className="font-medium text-purple-300">
                Shoda: {(file.matchConfidence * 100).toFixed(0)}%
              </span>
              {file.existingFileId && (
                <span className="text-purple-400">
                  (ID: {file.existingFileId.slice(0, 8)}...)
                </span>
              )}
            </div>
            {file.matchReasons && file.matchReasons.length > 0 && (
              <ul className="list-disc list-inside ml-2 text-purple-300">
                {file.matchReasons.slice(0, 2).map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
                {file.matchReasons.length > 2 && (
                  <li>...a {file.matchReasons.length - 2} dalších</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* File Stats */}
        <div className="text-xs text-muted-foreground">
          {typeof file.content === 'string' ? (
            <>
              {file.content.length} znaků • {file.content.split('\n').length} řádků
            </>
          ) : (
            <>
              {JSON.stringify(file.content).length} znaků • Strukturovaný obsah
            </>
          )}
        </div>
      </div>
    </Card>
  )
}